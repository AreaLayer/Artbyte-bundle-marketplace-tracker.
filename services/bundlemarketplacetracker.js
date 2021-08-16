require('dotenv').config()
const ethers = require('ethers')
const axios = require('axios')

const BundleMarketplaceContractInfo = require('../constants/bundlemarketplacecontractabi')

const provider = new ethers.providers.JsonRpcProvider(
  process.env.NETWORK_RPC,
  parseInt(process.env.NETWORK_CHAINID),
)

const loadBundleMarketplaceContract = () => {
  let abi = BundleMarketplaceContractInfo.abi
  let address = process.env.CONTRACTADDRESS
  let contract = new ethers.Contract(address, abi, provider)
  return contract
}

const bundleMarketPlaceSC = loadBundleMarketplaceContract()

const apiEndPoint = process.env.API_ENDPOINT

const toLowerCase = (val) => {
  if (val) return val.toLowerCase()
  else return val
}
const decimalStore = new Map()
const parseToken = async (inWei, paymentToken) => {
  paymentToken = toLowerCase(paymentToken)
  let tokenDecimals = decimalStore.get(paymentToken)
  console.log(tokenDecimals)
  if (tokenDecimals > 0)
    return parseFloat(inWei.toString()) / 10 ** tokenDecimals
  let decimals = await axios({
    method: 'get',
    url: process.env.DECIMAL_ENDPOINT + paymentToken,
  })
  decimals = parseInt(decimals.data.data)
  decimalStore.set(paymentToken, decimals)
  return parseFloat(inWei.toString()) / 10 ** decimals
}
const convertTime = (value) => {
  return parseFloat(value) * 1000
}

const callAPI = async (endpoint, data) => {
  try {
    let response = await axios({
      method: 'post',
      url: apiEndPoint + endpoint,
      data,
    })
    console.log(response)
  } catch (error) {
    console.log(endpoint)
    console.log(error)
  }
}

const trackBundleMarketPlace = () => {
  console.log('bundle marketplace tracker has been started')

  //   item listed
  bundleMarketPlaceSC.on(
    'ItemListed',
    async (owner, bundleID, paymentToken, price, startingTime) => {
      owner = toLowerCase(owner)
      paymentToken = toLowerCase(paymentToken)
      price = await parseToken(price, paymentToken)
      startingTime = convertTime(startingTime)
      await callAPI('itemListed', {
        owner,
        bundleID,
        paymentToken,
        price,
        startingTime,
      })
    },
  )

  //   item sold
  bundleMarketPlaceSC.on(
    'ItemSold',
    async (seller, buyer, bundleID, paymentToken, unitPrice, price) => {
      seller = toLowerCase(seller)
      buyer = toLowerCase(buyer)
      paymentToken = toLowerCase(paymentToken)
      price = await parseToken(price, paymentToken)
      await callAPI('itemSold', {
        seller,
        buyer,
        bundleID,
        paymentToken,
        price,
      })
    },
  )

  //   item updated

  bundleMarketPlaceSC.on(
    'ItemUpdated',
    async (owner, bundleID, nft, tokenID, quantity, paymentToken, newPrice) => {
      owner = toLowerCase(owner)
      paymentToken = toLowerCase(paymentToken)

      let nfts = []
      let tokenIDs = []
      let quantities = []

      nft.map((item) => {
        nfts.push(toLowerCase(item))
      })
      tokenID.map((item) => {
        tokenIDs.push(parseInt(item))
      })
      quantity.map((item) => {
        quantities.push(parseInt(item))
      })
      newPrice = await parseToken(newPrice, paymentToken)
      await callAPI('itemUpdated', {
        owner,
        bundleID,
        nft: nfts,
        tokenID: tokenIDs,
        quantity: quantities,
        newPrice,
        paymentToken,
      })
    },
  )

  //   item cancelled
  bundleMarketPlaceSC.on('ItemCanceled', async (owner, bundleID) => {
    owner = toLowerCase(owner)
    await callAPI('itemCanceled', { owner, bundleID })
  })

  // offer created
  bundleMarketPlaceSC.on(
    'OfferCreated',
    async (creator, bundleID, paymentToken, price, deadline) => {
      creator = toLowerCase(creator)
      paymentToken = toLowerCase(paymentToken)
      price = await parseToken(price, paymentToken)
      deadline = convertTime(deadline)
      await callAPI('offerCreated', {
        creator,
        bundleID,
        paymentToken,
        price,
        deadline,
      })
    },
  )

  // offer cancelled
  bundleMarketPlaceSC.on('OfferCanceled', async (creator, bundleID) => {
    creator = toLowerCase(creator)
    await callAPI('offerCanceled', { creator, bundleID })
  })
}

module.exports = trackBundleMarketPlace
