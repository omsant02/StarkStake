use starknet::ContractAddress;

#[starknet::interface]
pub trait IStakingContract<TContractState> {
    fn set_reward_amount(ref self: TContractState, amount: u256);
    fn set_reward_duration(ref self: TContractState, duration: u256);
    fn stake(ref self: TContractState, amount: u256);
    fn withdraw(ref self: TContractState, amount: u256);
    fn get_rewards(self: @TContractState, account: ContractAddress) -> u256;
    fn claim_rewards(ref self: TContractState);
    fn buy_stake_tokens(ref self: TContractState, amount: u256);
    fn get_stake_token_balance(self: @TContractState, account: ContractAddress) -> u256;
    fn get_staked_balance(self: @TContractState, account: ContractAddress) -> u256;
    fn get_reward_token_balance(self: @TContractState, account: ContractAddress) -> u256;
    fn set_token_price(ref self: TContractState, new_price: u256);
    fn withdraw_eth(ref self: TContractState, amount: u256);
}

mod Errors {
    pub const NULL_REWARDS: felt252 = 'Reward amount must be > 0';
    pub const NOT_ENOUGH_REWARDS: felt252 = 'Reward amount must be > balance';
    pub const NULL_AMOUNT: felt252 = 'Amount must be > 0';
    pub const NULL_DURATION: felt252 = 'Duration must be > 0';
    pub const UNFINISHED_DURATION: felt252 = 'Reward duration not finished';
    pub const NOT_OWNER: felt252 = 'Caller is not the owner';
    pub const NOT_ENOUGH_BALANCE: felt252 = 'Balance too low';
    pub const INSUFFICIENT_ETH: felt252 = 'Insufficient ETH sent';
}

#[starknet::contract]
pub mod StakingContract {
    use core::starknet::event::EventEmitter;
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, get_contract_address};
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess
    };

    #[storage]
    struct Storage {
        pub staking_token: IERC20Dispatcher,
        pub reward_token: IERC20Dispatcher,
        pub owner: ContractAddress,
        pub reward_rate: u256,
        pub duration: u256,
        pub current_reward_per_staked_token: u256,
        pub finish_at: u256,
        pub last_updated_at: u256,
        pub last_user_reward_per_staked_token: Map::<ContractAddress, u256>,
        pub unclaimed_rewards: Map::<ContractAddress, u256>,
        pub total_distributed_rewards: u256,
        pub total_supply: u256,
        pub balance_of: Map::<ContractAddress, u256>,
        pub token_price: u256,
    }

    #[event]
    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub enum Event {
        Deposit: Deposit,
        Withdrawal: Withdrawal,
        RewardsFinished: RewardsFinished,
        TokensPurchased: TokensPurchased,
    }

    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub struct Deposit {
        pub user: ContractAddress,
        pub amount: u256,
    }

    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub struct Withdrawal {
        pub user: ContractAddress,
        pub amount: u256,
    }

    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub struct RewardsFinished {
        pub msg: felt252,
    }

    #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    pub struct TokensPurchased {
        pub user: ContractAddress,
        pub amount: u256,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        staking_token_address: ContractAddress,
        reward_token_address: ContractAddress,
    ) {
        self.staking_token.write(IERC20Dispatcher { contract_address: staking_token_address });
        self.reward_token.write(IERC20Dispatcher { contract_address: reward_token_address });
        self.owner.write(get_caller_address());
        self.token_price.write(1_u256);
    }

    #[abi(embed_v0)]
    impl StakingContract of super::IStakingContract<ContractState> {
        fn set_reward_duration(ref self: ContractState, duration: u256) {
            self.only_owner();

            assert(duration > 0, super::Errors::NULL_DURATION);

            assert(
                self.finish_at.read() < get_block_timestamp().into(),
                super::Errors::UNFINISHED_DURATION
            );

            self.duration.write(duration);
        }

        fn set_reward_amount(ref self: ContractState, amount: u256) {
            self.only_owner();
            self.update_rewards(Zero::zero());

            assert(amount > 0, super::Errors::NULL_REWARDS);
            assert(self.duration.read() > 0, super::Errors::NULL_DURATION);

            let block_timestamp: u256 = get_block_timestamp().into();

            let rate = if self.finish_at.read() < block_timestamp {
                amount / self.duration.read()
            } else {
                let remaining_rewards = self.reward_rate.read()
                    * (self.finish_at.read() - block_timestamp);
                (remaining_rewards + amount) / self.duration.read()
            };

            assert(
                self.reward_token.read().balance_of(get_contract_address()) >= rate
                    * self.duration.read(),
                super::Errors::NOT_ENOUGH_REWARDS
            );

            self.reward_rate.write(rate);
            self.finish_at.write(block_timestamp + self.duration.read());
            self.last_updated_at.write(block_timestamp);
            self.total_distributed_rewards.write(0);
        }

        fn stake(ref self: ContractState, amount: u256) {
            assert(amount > 0, super::Errors::NULL_AMOUNT);

            let user = get_caller_address();
            self.update_rewards(user);

            self.balance_of.write(user, self.balance_of.read(user) + amount);
            self.total_supply.write(self.total_supply.read() + amount);
            self.staking_token.read().transfer_from(user, get_contract_address(), amount);

            self.emit(Deposit { user, amount });
        }

        fn withdraw(ref self: ContractState, amount: u256) {
            assert(amount > 0, super::Errors::NULL_AMOUNT);

            let user = get_caller_address();

            assert(
                self.balance_of.read(user) >= amount,
                super::Errors::NOT_ENOUGH_BALANCE
            );

            self.update_rewards(user);

            self.balance_of.write(user, self.balance_of.read(user) - amount);
            self.total_supply.write(self.total_supply.read() - amount);
            self.staking_token.read().transfer(user, amount);

            self.emit(Withdrawal { user, amount });
        }

        fn get_rewards(self: @ContractState, account: ContractAddress) -> u256 {
            self.unclaimed_rewards.read(account) + self.compute_new_rewards(account)
        }

        fn claim_rewards(ref self: ContractState) {
            let user = get_caller_address();
            self.update_rewards(user);

            let rewards = self.unclaimed_rewards.read(user);

            if rewards > 0 {
                self.unclaimed_rewards.write(user, 0);
                self.reward_token.read().transfer(user, rewards);
            }
        }

        fn buy_stake_tokens(ref self: ContractState, amount: u256) {
            let caller = get_caller_address();
            let price = (amount * self.token_price.read()) / 100000; // Convert to ETH
            assert(starknet::get_tx_info().unbox().value >= price, super::Errors::INSUFFICIENT_ETH);
            
            self.staking_token.read().transfer(caller, amount);
            self.emit(TokensPurchased { user: caller, amount });
        }

        fn get_stake_token_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.staking_token.read().balance_of(account)
        }

        fn get_staked_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.balance_of.read(account)
        }

        fn get_reward_token_balance(self: @ContractState, account: ContractAddress) -> u256 {
            self.reward_token.read().balance_of(account)
        }

        fn set_token_price(ref self: ContractState, new_price: u256) {
            self.only_owner();
            // new_price is expected to be in ETH with 5 decimal places
            // e.g., 1 = 0.00001 ETH, 2 = 0.00002 ETH, etc.
            self.token_price.write(new_price);
        }

        fn withdraw_eth(ref self: ContractState, amount: u256) {
            self.only_owner();
            starknet::send_eth_to_address(self.owner.read(), amount);
        }
    }

    #[generate_trait]
    impl PrivateFunctions of PrivateFunctionsTrait {
        fn update_rewards(ref self: ContractState, account: ContractAddress) {
            self
                .current_reward_per_staked_token
                .write(self.compute_current_reward_per_staked_token());

            self.last_updated_at.write(self.last_time_applicable());

            if account.is_non_zero() {
                self.distribute_user_rewards(account);

                self
                    .last_user_reward_per_staked_token
                    .write(account, self.current_reward_per_staked_token.read());

                self.send_rewards_finished_event();
            }
        }

        fn distribute_user_rewards(ref self: ContractState, account: ContractAddress) {
            let user_rewards = self.get_rewards(account);
            self.unclaimed_rewards.write(account, user_rewards);
            self
                .total_distributed_rewards
                .write(self.total_distributed_rewards.read() + user_rewards);
        }

        fn send_rewards_finished_event(ref self: ContractState) {
            if self.last_updated_at.read() == self.finish_at.read() {
                let total_rewards = self.reward_rate.read() * self.duration.read();

                if total_rewards != 0 && self.total_distributed_rewards.read() == total_rewards {
                    self.emit(RewardsFinished { msg: 'Rewards all distributed' });
                } else {
                    self.emit(RewardsFinished { msg: 'Rewards not active yet' });
                }
            }
        }

        fn compute_current_reward_per_staked_token(self: @ContractState) -> u256 {
            if self.total_supply.read() == 0 {
                self.current_reward_per_staked_token.read()
            } else {
                self.current_reward_per_staked_token.read()
                    + self.reward_rate.read()
                        * (self.last_time_applicable() - self.last_updated_at.read())
                        / self.total_supply.read()
            }
        }

        fn compute_new_rewards(self: @ContractState, account: ContractAddress) -> u256 {
            self.balance_of.read(account)
                * (self.current_reward_per_staked_token.read()
                    - self.last_user_reward_per_staked_token.read(account))
        }

        #[inline(always)]
        fn last_time_applicable(self: @ContractState) -> u256 {
            Self::min(self.finish_at.read(), get_block_timestamp().into())
        }

        #[inline(always)]
        fn min(x: u256, y: u256) -> u256 {
            if (x <= y) {
                x
            } else {
                y
            }
        }

        fn only_owner(self: @ContractState) {
            let caller = get_caller_address();
            assert(caller == self.owner.read(), super::Errors::NOT_OWNER);
        }
    }
}