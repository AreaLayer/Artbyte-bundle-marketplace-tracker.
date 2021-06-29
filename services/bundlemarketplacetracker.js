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
      console.log(
        owner,
        bundleID,
        price,
        startingTime,
        isPrivate,
        allowedAddress,
      )
      await callAPI('itemListed', { owner, bundleID, price, startingTime })
    },
  )

  //   item sold
  bundleMarketPlaceSC.on('ItemSold', async (seller, buyer, bundleID, price) => {
    console.log(seller, buyer, bundleID, price)
    await callAPI('itemSold', { seller, buyer, bundleID, price })
  })

  //   item updated

  bundleMarketPlaceSC.on(
    'ItemUpdated',
    async (owner, bundleID, nft, tokenID, quantity, newPrice) => {
      console.log(owner, bundleID, nft, tokenID, quantity, newPrice)
      await callAPI('itemUpdated', {
        owner,
        bundleID,
        nft,
        tokenID,
        quantity,
        newPrice,
      })
    },
  )

  //   item cancelled
  bundleMarketPlaceSC.on('ItemCanceled', async (owner, bundleID) => {
    console.log(owner, bundleID)
    await callAPI('itemCanceled', { owner, bundleID })
  })

  // offer created
  bundleMarketPlaceSC.on(
    'OfferCreated',
    async (creator, bundleID, payToken, price, deadline) => {
      console.log(creator, bundleID, payToken, price, deadline)
      await callAPI('offerCreated', { creator, bundleID, price, deadline })
    },
  )

  // offer cancelled
  bundleMarketPlaceSC.on('OfferCanceled', async (creator, bundleID) => {
    console.log(creator, bundleID)
    await callAPI('offerCanceled', { creator, bundleID })
  })
}

module.exports = trackBundleMarketPlace
