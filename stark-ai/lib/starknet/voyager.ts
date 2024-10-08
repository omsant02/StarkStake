export interface TokenInfo {
    address: string
    name: string
    symbol: string
    decimals: number
  }
  
  export const getTokens = async () => {
    try {
      console.log("voyager started");
      const response = await fetch(
        'https://sepolia-api.voyager.online/beta/tokens?attribute=holders&type=erc20&ps=50&p=1',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.VOYAGER_API_KEY!
          }
        }
      )
  
      const data = await response.json()
      return data.items as TokenInfo[]
    } catch (e) {
      console.log(e)
      return []
    }
  }
  
  export const getToken = async (tokenName: string) => {
    console.log("get token started");
    const tokens = await getTokens()
    const token = tokens.find(
      (t: { name: string; symbol: string }) =>
        t.name.toLowerCase() === tokenName.toLowerCase() ||
        t.symbol.toLowerCase() === tokenName.toLowerCase()
    )
  
    return token
  }
  