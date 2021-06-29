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

const callAPI = (endpoint, data) => {
  axios({
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
    (owner, bundleID, price, startingTime, isPrivate, allowedAddress) => {
      callAPI('itemListed', { owner, bundleID, price, startingTime })
    },
  )

  //   item sold
  bundleMarketPlaceSC.on('ItemSold', (seller, buyer, bundleID, price) => {
    callAPI('itemSold', { seller, buyer, bundleID, price })
  })

  //   item updated

  bundleMarketPlaceSC.on(
    'ItemUpdated',
    (owner, bundleID, nft, tokenID, quantity, newPrice) => {
      callAPI('itemUpdated', {
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
  bundleMarketPlaceSC.on('ItemCanceled', (owner, bundleID) => {
    callAPI('itemCanceled', { owner, bundleID })
  })

  // offer created
  bundleMarketPlaceSC.on(
    'OfferCreated',
    (creator, bundleID, payToken, price, deadline) => {
      callAPI('offerCreated', { creator, bundleID, price, deadline })
    },
  )

  // offer cancelled
  bundleMarketPlaceSC.on('OfferCanceled', (creator, bundleID) => {
    callAPI('offerCanceled', { creator, bundleID })
  })
}

module.exports = trackBundleMarketPlace
