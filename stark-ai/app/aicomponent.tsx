"use client"
const { Groq } = require('groq-sdk');
require('dotenv').config();
import { Send } from './send';
import { getToken } from '../lib/starknet/voyager'
import { useStarknet } from '@/lib/hooks/use-starknet'
import { SendTokenArgs, sendToken } from '../lib/starknet/send'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

//const apiKeyGroq = process.env.GROQ_API_KEY;
//const apiKeyGroq = ;

const client = new Groq({ apiKey: apiKeyGroq, dangerouslyAllowBrowser: true });
const MODEL = 'llama3-groq-70b-8192-tool-use-preview';

//const { primaryWallet } = useDynamicContext();
//const { transfer } = useStarknet();

function calculate(args: { expression: string }): any {
    try {
        // Note: Using eval() in JavaScript can be dangerous.
        // In a production environment, you should use a safer alternative.
        const result = eval(args.expression);
        return JSON.stringify({ result });
    } catch {
        return JSON.stringify({ error: "Invalid prompt" });
    }
}

async function transferToken(args: { tokenName: string, recipient: string, amount: string, wallet: any }): Promise<string> {
    try {
        // Note: Using eval() in JavaScript can be dangerous.
        // In a production environment, you should use a safer alternative.
        //---
        // const token1 = await getToken(args.tokenName);
        // if (!token1) {
        //     return `Could not find token ${token1}`
        // }
        // const amountBigint = BigInt(args.amount * 10 ** token1.decimals);
        // return (        
        // <Send
        //     recipient={args.recipient}
        //     amount={amountBigint}
        //     token={token1}
        //   />
        // )
        //----
        console.log("hey");
        console.log(args.wallet);
        console.log(args.amount);
        console.log(args.recipient);
        console.log(args.tokenName);
        let myMap = new Map<string, string>([
            ["STRKBOT", "0x05ab9c6b81f1d1a7aac290940584a9d26c49ac1014097ef3bf11710445ebf285"]
        ]);
        console.log("hey");
        //const token1 = await getToken(args.tokenName);
        console.log("started_with_fxn2");
        // if (!token1) {
        //     return `Could not find token ${token1}`
        // }
        const amountInt = parseInt(args.amount);
        const amountBigint = BigInt(amountInt * 10 ** 18);
        const tokenAddress = myMap.get(args.tokenName);
        if (!tokenAddress) {
            return `Could not find token ${args.tokenName}`
        }
    //     <Send
    //     recipient={args.recipient}
    //     amount={amountBigint}
    //     token={tokenAddress}
    //   />
        
        //const { primaryWallet } = await useDynamicContext();
        //console.log(primaryWallet);
        //await YourComponent({tokenAddress: tokenAddress, recipient: args.recipient, amount: amountBigint});

        await sendToken({wallet: args.wallet, tokenAddress: tokenAddress, recipient: args.recipient, amount: amountBigint});
        //const { transfer } = useStarknet();
            // void await transfer({
            //     tokenAddress: tokenAddress,
            //     recipient: args.recipient,
            //     amount: amountBigint
            //   })


        return `Transfered ${args.amount} ${args.tokenName} to ${args.recipient}`;  
    } catch {
        console.log("error");
        return JSON.stringify({ error: "Invalid prompt" });
    }
}

// imports calculate function from step 1
export async function runConversation(prompt: string, wallet: any): Promise<string> {
    const messages = [
        {
            role: "system",
            content: "You are a DeFi bot on Starknet and you can help users with activities like checking their balance of a token, transferring tokens to others, swapping tokens on DEXes, and understanding past transactions by simulating them. If the user requests to swap some token X for token Y and the amount of X to swap, call swapTokens function to swap token to another token.If the user requests to send some token X to recipient Y for amount Z, call transferToken function to transfer token to another address.If the user requests to check the balance of a token in a wallet, call balanceOf function to check the balance of a token in a wallet.Besides that, you can also chat with users and do some calculations if needed."
        },
        {
            role: "user",
            content: prompt,
        }
    ];

    const tools = [
        {
            type: "function",
            function: {
                name: "transferToken",
                description: "Transfer token X to recipient Y for amount Z. Use this if the user wants to transfer some token to another address.",
                parameters: {
                    type: "object",
                    properties: {
                        tokenName: {
                            type: "string",
                            description: "The name of the token that will be sent to other address. e.g. STRKBOT/USDC/STRK/ETH.",
                        },
                        recipient: {
                            type: "string",
                            description: "The address of the recipient starting with 0x.",
                        },
                        amount: {
                            type: "string",
                            description: "The amount of token to transfer.",
                        }
                    },
                    required: ["tokenName", "recipient", "amount"],
                },
            },
        }        
    ];

    const response = await client.chat.completions.create({
        model: MODEL,
        messages: messages,
        stream: false,
        tools: tools,
        tool_choice: "auto",
        max_tokens: 4096
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    console.log(toolCalls);

    if (toolCalls) {
        interface AvailableFunction {
            [key: string]: (args: { tokenName: string, recipient: string, amount: string, wallet: any }) => any;
        }

        interface Message {
            tool_call_id?: string;
            role: string;
            name: string;
            content: string;
        }

        const availableFunctions: AvailableFunction = {
            transferToken: transferToken,
        };

        messages.push(responseMessage);

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionToCall = availableFunctions[functionName];
            const functionArgs = JSON.parse(toolCall.function.arguments);
            console.log(functionArgs);
            const functionResponse = await functionToCall({tokenName:functionArgs.tokenName, recipient:functionArgs.recipient, amount:functionArgs.amount, wallet:wallet});

            // Ensure the content is always a string
            const contentString = typeof functionResponse === 'string' ? functionResponse : JSON.stringify(functionResponse);
            messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: contentString,
            }as Message);
        }

        const secondResponse = await client.chat.completions.create({
            model: MODEL,
            messages: messages
        });

        return secondResponse.choices[0].message.content;
    }

    return responseMessage.content;
}

// const userPrompt = "What is 25 * 4 + 10?";
// runConversation(userPrompt).then(console.log).catch(console.error);