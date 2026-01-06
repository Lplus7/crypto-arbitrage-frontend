/**
 * Генератор URL для торговых пар на биржах.
 * Каждая биржа имеет свой формат URL для спотовой торговли.
 */

/**
 * Получить URL для торговой пары на бирже
 * @param {string} exchange - Название биржи (например, "binance", "okx")
 * @param {string} pair - Торговая пара (например, "BTC/USDT", "ETH/USDC")
 * @returns {string|null} URL для торговли или null если биржа не поддерживается
 */
export function getTradeUrl(exchange, pair) {
  if (!exchange || !pair) return null
  
  exchange = exchange.toLowerCase().trim()
  pair = pair.trim().toUpperCase()
  
  // Разбиваем пару на base и quote
  let base, quote
  if (pair.includes('/')) {
    [base, quote] = pair.split('/')
  } else if (pair.includes('-')) {
    [base, quote] = pair.split('-')
  } else {
    // Пробуем угадать (BTCUSDT -> BTC, USDT)
    const quotes = ['USDT', 'USDC', 'BTC', 'ETH', 'BUSD']
    for (const q of quotes) {
      if (pair.endsWith(q)) {
        base = pair.slice(0, -q.length)
        quote = q
        break
      }
    }
    if (!base) return null
  }
  
  base = base.trim()
  quote = quote.trim()
  
  // === ГЕНЕРАТОРЫ URL ДЛЯ БИРЖ ===
  
  const urlGenerators = {
    // Binance: https://www.binance.com/ru/trade/BTC_USDT
    binance: () => `https://www.binance.com/ru/trade/${base}_${quote}`,
    
    // Binance US
    binanceus: () => `https://www.binance.us/spot-trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    
    // OKX: https://www.okx.com/ru/trade-spot/btc-usdt
    okx: () => `https://www.okx.com/ru/trade-spot/${base.toLowerCase()}-${quote.toLowerCase()}`,
    myokx: () => `https://www.okx.com/ru/trade-spot/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // Bybit: https://www.bybit.com/trade/spot/BTC/USDT
    bybit: () => `https://www.bybit.com/trade/spot/${base}/${quote}`,
    
    // KuCoin: https://www.kucoin.com/trade/BTC-USDT
    kucoin: () => `https://www.kucoin.com/trade/${base}-${quote}`,
    
    // Gate.io: https://www.gate.io/trade/BTC_USDT
    gateio: () => `https://www.gate.io/trade/${base}_${quote}`,
    gate: () => `https://www.gate.io/trade/${base}_${quote}`,
    
    // MEXC: https://www.mexc.com/exchange/BTC_USDT
    mexc: () => `https://www.mexc.com/exchange/${base}_${quote}`,
    
    // Kraken: https://www.kraken.com/prices/btc-bitcoin
    kraken: () => `https://www.kraken.com/prices/${base.toLowerCase()}`,
    
    // Bitfinex: https://trading.bitfinex.com/t/BTC:USDT
    bitfinex: () => `https://trading.bitfinex.com/t/${base}:${quote}`,
    
    // Poloniex: https://poloniex.com/trade/BTC_USDT
    poloniex: () => `https://poloniex.com/trade/${base}_${quote}`,
    
    // HitBTC: https://hitbtc.com/btc-to-usdt
    hitbtc: () => `https://hitbtc.com/${base.toLowerCase()}-to-${quote.toLowerCase()}`,
    
    // Huobi/HTX: https://www.htx.com/trade/btc_usdt
    huobi: () => `https://www.htx.com/trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    htx: () => `https://www.htx.com/trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    
    // Coinbase: https://www.coinbase.com/advanced-trade/spot/BTC-USDT
    coinbase: () => `https://www.coinbase.com/advanced-trade/spot/${base}-${quote}`,
    coinbaseadvanced: () => `https://www.coinbase.com/advanced-trade/spot/${base}-${quote}`,
    coinbaseexchange: () => `https://www.coinbase.com/advanced-trade/spot/${base}-${quote}`,
    
    // Bitstamp: https://www.bitstamp.net/markets/btc/usd/
    bitstamp: () => `https://www.bitstamp.net/markets/${base.toLowerCase()}/${quote.toLowerCase()}/`,
    
    // Gemini: https://exchange.gemini.com/trade/BTCUSD
    gemini: () => `https://exchange.gemini.com/trade/${base}${quote}`,
    
    // Crypto.com: https://crypto.com/exchange/trade/BTC_USDT
    cryptocom: () => `https://crypto.com/exchange/trade/${base}_${quote}`,
    
    // BingX: https://bingx.com/en-us/spot/BTCUSDT/
    bingx: () => `https://bingx.com/en-us/spot/${base}${quote}/`,
    
    // Bitget: https://www.bitget.com/spot/BTCUSDT
    bitget: () => `https://www.bitget.com/spot/${base}${quote}`,
    
    // Bitmart: https://www.bitmart.com/trade/en-US?symbol=BTC_USDT
    bitmart: () => `https://www.bitmart.com/trade/en-US?symbol=${base}_${quote}`,
    
    // Bitrue: https://www.bitrue.com/trade/btc_usdt
    bitrue: () => `https://www.bitrue.com/trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    
    // LBank: https://www.lbank.com/trade/btc_usdt
    lbank: () => `https://www.lbank.com/trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    
    // WhiteBIT: https://whitebit.com/trade/BTC-USDT
    whitebit: () => `https://whitebit.com/trade/${base}-${quote}`,
    
    // CoinEx: https://www.coinex.com/exchange/btc-usdt
    coinex: () => `https://www.coinex.com/exchange/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // AscendEX: https://ascendex.com/en/cashtrade-spottrading/usdt/btc
    ascendex: () => `https://ascendex.com/en/cashtrade-spottrading/${quote.toLowerCase()}/${base.toLowerCase()}`,
    
    // Phemex: https://phemex.com/spot/trade/BTCUSDT
    phemex: () => `https://phemex.com/spot/trade/${base}${quote}`,
    
    // Digifinex: https://www.digifinex.com/en-ww/trade/USDT/BTC
    digifinex: () => `https://www.digifinex.com/en-ww/trade/${quote}/${base}`,
    
    // EXMO: https://exmo.com/en/trade/BTC_USDT
    exmo: () => `https://exmo.com/en/trade/${base}_${quote}`,
    
    // Upbit: https://upbit.com/exchange?code=CRIX.UPBIT.USDT-BTC
    upbit: () => `https://upbit.com/exchange?code=CRIX.UPBIT.${quote}-${base}`,
    
    // BigONE: https://big.one/trade/BTC-USDT
    bigone: () => `https://big.one/trade/${base}-${quote}`,
    
    // Bequant: https://bequant.io/exchange/BTC-USDT
    bequant: () => `https://bequant.io/exchange/${base}-${quote}`,
    
    // CEX.IO: https://cex.io/btc-usdt
    cex: () => `https://cex.io/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // Delta: https://www.delta.exchange/app/trade/BTC-USDT
    delta: () => `https://www.delta.exchange/app/trade/${base}-${quote}`,
    
    // Toobit: https://www.toobit.com/en-US/spot/BTC_USDT
    toobit: () => `https://www.toobit.com/en-US/spot/${base}_${quote}`,
    
    // XT: https://www.xt.com/en/trade/btc_usdt
    xt: () => `https://www.xt.com/en/trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    
    // P2B: https://p2pb2b.com/trade/BTC_USDT/
    p2b: () => `https://p2pb2b.com/trade/${base}_${quote}/`,
    
    // ProBit: https://www.probit.com/app/exchange/BTC-USDT
    probit: () => `https://www.probit.com/app/exchange/${base}-${quote}`,
    
    // Bitvavo: https://account.bitvavo.com/markets/BTC-EUR
    bitvavo: () => `https://account.bitvavo.com/markets/${base}-${quote}`,
    
    // Zonda: https://zondacrypto.com/en/exchange-rate/btc-usdt
    zonda: () => `https://zondacrypto.com/en/exchange-rate/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // FMFW.io: https://fmfw.io/BTC-USDT
    fmfwio: () => `https://fmfw.io/${base}-${quote}`,
    
    // Blofin: https://blofin.com/spot/BTC-USDT
    blofin: () => `https://blofin.com/spot/${base}-${quote}`,
    
    // Deepcoin: https://www.deepcoin.com/en/spot/BTC_USDT
    deepcoin: () => `https://www.deepcoin.com/en/spot/${base}_${quote}`,
    
    // Hyperliquid: https://app.hyperliquid.xyz/trade/BTC
    hyperliquid: () => `https://app.hyperliquid.xyz/trade/${base}`,
    
    // Coinmetro: https://coinmetro.com/exchange/btc-usdt
    coinmetro: () => `https://coinmetro.com/exchange/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // Timex: https://timex.io/trade/BTC-USDT
    timex: () => `https://timex.io/trade/${base}-${quote}`,
    
    // BTC-Alpha: https://btc-alpha.com/exchange/BTC_USDT
    btcalpha: () => `https://btc-alpha.com/exchange/${base}_${quote}`,
    
    // Bitteam: https://bit.team/trade/BTC-USDT
    bitteam: () => `https://bit.team/trade/${base}-${quote}`,
    
    // BitoPro: https://www.bitopro.com/ns/trade/btc_usdt
    bitopro: () => `https://www.bitopro.com/ns/trade/${base.toLowerCase()}_${quote.toLowerCase()}`,
    
    // Novadax: https://www.novadax.com.br/trade/BTC_USDT
    novadax: () => `https://www.novadax.com.br/trade/${base}_${quote}`,
    
    // Luno: https://www.luno.com/trade/markets/BTCUSDT
    luno: () => `https://www.luno.com/trade/markets/${base}${quote}`,
    
    // CoinsPH: https://pro.coins.ph/trade/BTC-PHP
    coinsph: () => `https://pro.coins.ph/trade/${base}-${quote}`,
    
    // BitBNS: https://bitbns.com/trade/#/btc
    bitbns: () => `https://bitbns.com/trade/#/${base.toLowerCase()}`,
    
    // Hollaex: https://pro.hollaex.com/trade/btc-usdt
    hollaex: () => `https://pro.hollaex.com/trade/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // HashKey: https://global.hashkey.com/en-US/spot/BTC-USDT
    hashkey: () => `https://global.hashkey.com/en-US/spot/${base}-${quote}`,
    
    // Blockchain.com: https://exchange.blockchain.com/trade/BTC-USDT
    blockchaincom: () => `https://exchange.blockchain.com/trade/${base}-${quote}`,
    
    // Coincatch: https://www.coincatch.com/en/spot/BTCUSDT
    coincatch: () => `https://www.coincatch.com/en/spot/${base}${quote}`,
    
    // Zebpay: https://zebpay.com/in/trade/btc-inr
    zebpay: () => `https://zebpay.com/in/trade/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // BTCTurk: https://pro.btcturk.com/pro/al-sat/BTC-USDT
    btcturk: () => `https://pro.btcturk.com/pro/al-sat/${base}-${quote}`,
    
    // Backpack: https://backpack.exchange/trade/BTC_USDT
    backpack: () => `https://backpack.exchange/trade/${base}_${quote}`,
    
    // Apex: https://pro.apex.exchange/trade/BTCUSDT
    apex: () => `https://pro.apex.exchange/trade/${base}${quote}`,
    
    // OneTrading: https://onetrading.com/trade/BTC_EUR
    onetrading: () => `https://onetrading.com/trade/${base}_${quote}`,
    
    // Foxbit: https://foxbit.com.br/trade/btc-brl
    foxbit: () => `https://foxbit.com.br/trade/${base.toLowerCase()}-${quote.toLowerCase()}`,
    
    // WavesExchange: https://waves.exchange/trading/spot/WAVES_USDT
    wavesexchange: () => `https://waves.exchange/trading/spot/${base}_${quote}`,
  }
  
  const generator = urlGenerators[exchange]
  return generator ? generator() : null
}

/**
 * Получить домашнюю страницу биржи
 * @param {string} exchange - Название биржи
 * @returns {string|null} URL главной страницы биржи
 */
export function getExchangeHomeUrl(exchange) {
  if (!exchange) return null
  
  exchange = exchange.toLowerCase().trim()
  
  const urls = {
    binance: 'https://www.binance.com',
    binanceus: 'https://www.binance.us',
    okx: 'https://www.okx.com',
    bybit: 'https://www.bybit.com',
    kucoin: 'https://www.kucoin.com',
    gateio: 'https://www.gate.io',
    mexc: 'https://www.mexc.com',
    kraken: 'https://www.kraken.com',
    bitfinex: 'https://www.bitfinex.com',
    poloniex: 'https://poloniex.com',
    hitbtc: 'https://hitbtc.com',
    huobi: 'https://www.htx.com',
    htx: 'https://www.htx.com',
    coinbase: 'https://www.coinbase.com',
    bitstamp: 'https://www.bitstamp.net',
    gemini: 'https://www.gemini.com',
    cryptocom: 'https://crypto.com',
    bingx: 'https://bingx.com',
    bitget: 'https://www.bitget.com',
    bitmart: 'https://www.bitmart.com',
    bitrue: 'https://www.bitrue.com',
    lbank: 'https://www.lbank.com',
    whitebit: 'https://whitebit.com',
    coinex: 'https://www.coinex.com',
    ascendex: 'https://ascendex.com',
    phemex: 'https://phemex.com',
    digifinex: 'https://www.digifinex.com',
    exmo: 'https://exmo.com',
    upbit: 'https://upbit.com',
    bigone: 'https://big.one',
    bequant: 'https://bequant.io',
    cex: 'https://cex.io',
    delta: 'https://www.delta.exchange',
    toobit: 'https://www.toobit.com',
    xt: 'https://www.xt.com',
    p2b: 'https://p2pb2b.com',
    probit: 'https://www.probit.com',
    bitvavo: 'https://bitvavo.com',
    zonda: 'https://zondacrypto.com',
    fmfwio: 'https://fmfw.io',
    blofin: 'https://blofin.com',
    deepcoin: 'https://www.deepcoin.com',
    hyperliquid: 'https://hyperliquid.xyz',
    coinmetro: 'https://coinmetro.com',
    timex: 'https://timex.io',
    btcalpha: 'https://btc-alpha.com',
    bitteam: 'https://bit.team',
    bitopro: 'https://www.bitopro.com',
    novadax: 'https://www.novadax.com.br',
    luno: 'https://www.luno.com',
    coinsph: 'https://coins.ph',
    bitbns: 'https://bitbns.com',
    hollaex: 'https://hollaex.com',
    hashkey: 'https://global.hashkey.com',
    blockchaincom: 'https://exchange.blockchain.com',
    coincatch: 'https://www.coincatch.com',
    zebpay: 'https://zebpay.com',
    btcturk: 'https://www.btcturk.com',
    backpack: 'https://backpack.exchange',
    apex: 'https://apex.exchange',
    onetrading: 'https://onetrading.com',
    foxbit: 'https://foxbit.com.br',
    wavesexchange: 'https://waves.exchange',
  }
  
  return urls[exchange] || null
}
