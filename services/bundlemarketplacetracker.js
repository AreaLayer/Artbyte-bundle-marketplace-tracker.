require('dotenv').config()
const ethers = require('ethers')
const axios = require('axios')

const BundleMarketplaceContractInfo = require('../constants/bundlemarketplacecontractabi')

const provider = new ethers.providers.JsonRpcProvider(
  process.env.MAINNET_RPC,
  parseInt(process.env.MAINNET_CHAINID),
)

const loadBundleMarketplaceContract = () => {
  let abi = BundleMarketplaceContractInfo.abi
  let address = BundleMarketplaceContractInfo.address
  let contract = new ethers.Contract(address, abi, provider)
  return contract
}

const bundleMarketPlaceSC = loadBundleMarketplaceContract()

const apiEndPoint = 'https://api0.artion.io/bundlemarketplace/'

const toLowerCase = (val) => {
  if (val) return val.toLowerCase()
  else return val
}
const parseToFTM = (inWei) => {
  return parseFloat(inWei.toString()) / 10 ** 18
}
const convertTime = (value) => {
  return parseFloat(value) * 1000
}

const callAPI = async (endpoint, data) => {
  await axios({
    method: 'post',
    url: apiEndPoint + endpoint,
    data,
  })
}

const trackBundleMarketPlace = () => {
  console.log('bundle marketplace tracker has been started')

  //   item listed
  bundleMarketPlaceSC.on(
    'ItemListed',
    async (owner, bundleID, price, startingTime, isPrivate, allowedAddress) => {
      owner = toLowerCase(owner)
      price = parseToFTM(price)
      startingTime = convertTime(startingTime)
      await callAPI('itemListed', { owner, bundleID, price, startingTime })
    },
  )

  //   item sold
  bundleMarketPlaceSC.on('ItemSold', async (seller, buyer, bundleID, price) => {
    seller = toLowerCase(seller)
    buyer = toLowerCase(buyer)
    price = parseToFTM(price)
    await callAPI('itemSold', { seller, buyer, bundleID, price })
  })

  //   item updated

  bundleMarketPlaceSC.on(
    'ItemUpdated',
    async (owner, bundleID, nft, tokenID, quantity, newPrice) => {
      owner = toLowerCase(owner)

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
      newPrice = parseToFTM(newPrice)
      console.log(owner, bundleID, nfts, tokenIDs, quantities, newPrice)
      await callAPI('itemUpdated', {
        owner,
        bundleID,
        nft: nfts,
        tokenID: tokenIDs,
        quantity: quantities,
        newPrice,
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
    async (creator, bundleID, payToken, price, deadline) => {
      creator = toLowerCase(creator)
      price = parseToFTM(price)
      deadline = convertTime(deadline)
      await callAPI('offerCreated', { creator, bundleID, price, deadline })
    },
  )

  // offer cancelled
  bundleMarketPlaceSC.on('OfferCanceled', async (creator, bundleID) => {
    creator = toLowerCase(creator)
    await callAPI('offerCanceled', { creator, bundleID })
  })
}

module.exports = trackBundleMarketPlace
