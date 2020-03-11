const axios = require("axios")

const baseUrls = {
  "development": "https://developers.decidir.com/api/v2",
  "production": "https://live.decidir.com/api/v2"
}

const endpoints = {
  healthCheck: "/healthcheck",
  removeCardToken: "/cardtokens",
  cardList: {
    "0": "/usersite",
    "1": "/cardtokens"
  },
  paymentsList: "/payments",
  makePayment: "/payments"
}

module.exports = {
  sdk: function ({ mode = "development", privateKey, publicKey, globalSiteId, globalSiteName }) {
    if (!(mode && privateKey)) throw new Error("Missing private key")
    
    axios.defaults.baseURL = baseUrls[mode]
    
    const headers = {
      apiKey: privateKey,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    }
    
    /**
    * Check payment gateway health
    * @return {Promise}
    */
    this.healthCheck = () => {
      return new Promise((resolve, reject) => {
        axios({
          method: "get",
          url: endpoints["healthCheck"],
        }).then((response) => {
          resolve(response.data)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    /**
    * Customer remove card
    * @param {string} cardToken - Customer's cardToken
    * @return {Promise}
    */
    this.removeCustomerCard = (cardToken) => {
      return new Promise((resolve, reject) => {
        if (!(cardToken && typeof cardToken === "string")) {
          reject(new Error("Invalid card token"))
        }
        axios({
          method: "delete",
          url: `${endpoints["removeCardToken"]}/${cardToken}`,
          headers
        }).then((response) => {
          resolve(response.data)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    
    /**
    * Customer card list
    * @param {string} userId - Customer's id
    * @return {Promise}
    */
    this.getCustomerCardList = (userId) => {
      return new Promise((resolve, reject) => {
        if (!(userId && typeof userId === "string")) {
          reject(new Error("Invalid user id"))
        }
        axios({
          method: "get",
          url: `${endpoints["cardList"]["0"]}/${userId}${endpoints["cardList"]["1"]}`,
          headers
        }).then((response) => {
          resolve(response.data)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    // Make split payment with a single vendor
    this.singleSplitPayment = (capturePayment) => {
      return new Promise((resolve, reject) => {
        const {
          siteTransactionId,
          cardToken,
          userId,
          email = null,
          paymentMethodId,
          bin,
          amount,
          currency = "ARS",
          installments = 1,
          description = null,
          vendorId,
          vendorAmount
        } = capturePayment
        if (!(siteTransactionId && typeof siteTransactionId === "string")) {
          reject(new Error("Invalid siteTransactionId"))
        }
        if (!(cardToken && typeof cardToken === "string")) {
          reject(new Error("Invalid cardToken"))
        }
        if (!(userId && typeof userId === "string")) {
          reject(new Error("Invalid userId"))
        }
        if (!(paymentMethodId && typeof paymentMethodId === "number")) {
          reject(new Error("Invalid paymentMethodId"))
        }
        if (!(bin && typeof bin === "string")) {
          reject(new Error("Invalid bin"))
        }
        if (!(amount && typeof amount === "number" && amount > 0)) {
          reject(new Error("Invalid amount"))
        }
        if (!(currency && typeof currency === "string")) {
          reject(new Error("Invalid currency"))
        }
        if (!(currency && typeof currency === "string")) {
          reject(new Error("Invalid currency"))
        }
        if (!(installments && typeof installments === "number")) {
          reject(new Error("Invalid installments"))
        }
        if (!(vendorId && typeof vendorId === "string")) {
          reject(new Error("Invalid vendorId"))
        }
        if (!(vendorAmount && typeof vendorAmount === "number" && vendorAmount > 0)) {
          reject(new Error("Invalid vendorAmount"))
        }
        
        const payload = {
          customer: {
            id: userId,
            email
          },
          site_transaction_id: siteTransactionId,
          token: cardToken,
          payment_method_id: paymentMethodId,
          bin,
          amount,
          currency,
          installments,
          description,
          payment_type: "distributed",
          establishment_name: globalSiteName,
          sub_payments: []
        }
        let platformAmount = Number((amount - vendorAmount).toFixed(2))
        // Add platform charge
        payload.sub_payments.push({
          site_id: globalSiteId,
          installments: 1,
          amount: platformAmount
        })

        // Add vendor charge
        payload.sub_payments.push({
          site_id: vendorId,
          installments: 1,
          amount: vendorAmount
        })
        axios({
          method: "post",
          url: `${endpoints["makePayment"]}`,
          data: payload,
          headers
        }).then((response) => {
          resolve(response.data)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    /**
    * Payment without split
    * @param {object} capturePayment - The payment object
    * @param {string} capturePayment.siteTransactionId - Unique Id by the site.
    * @param {string} capturePayment.cardToken - Customer card token.
    * @param {string} capturePayment.userId - Customer Id.
    * @param {string} capturePayment.email - Customer email.
    * @param {number} capturePayment.paymentMethodId - Don't know.
    * @param {string} capturePayment.bin - First 6 digit of the card.
    * @param {number} capturePayment.amount - Billable amount, (Eg. 20.30).
    * @param {string} [capturePayment.currency=ARS] - Currency supported ["ARS"].
    * @param {number} [capturePayment.installments=1] - Number of installments (default 1).
    * @param {string} [capturePayment.description=null] - Description of the transaction.
    * @return {Promise}
    */
    this.payment = (capturePayment) => {
      return new Promise((resolve, reject) => {
        const {
          siteTransactionId,
          cardToken,
          userId,
          email = null,
          paymentMethodId,
          bin,
          amount,
          currency = "ARS",
          installments = 1,
          description = null
        } = capturePayment
        if (!(siteTransactionId && typeof siteTransactionId === "string")) {
          reject(new Error("Invalid siteTransactionId"))
        }
        if (!(cardToken && typeof cardToken === "string")) {
          reject(new Error("Invalid cardToken"))
        }
        if (!(userId && typeof userId === "string")) {
          reject(new Error("Invalid userId"))
        }
        if (!(paymentMethodId && typeof paymentMethodId === "number")) {
          reject(new Error("Invalid paymentMethodId"))
        }
        if (!(bin && typeof bin === "string")) {
          reject(new Error("Invalid bin"))
        }
        if (!(amount && typeof amount === "number" && amount > 0)) {
          reject(new Error("Invalid amount"))
        }
        if (!(currency && typeof currency === "string")) {
          reject(new Error("Invalid currency"))
        }
        if (!(currency && typeof currency === "string")) {
          reject(new Error("Invalid currency"))
        }
        if (!(installments && typeof installments === "number")) {
          reject(new Error("Invalid installments"))
        }
        
        const payload = {
          customer: {
            id: userId,
            email
          },
          site_transaction_id: siteTransactionId,
          token: cardToken,
          payment_method_id: paymentMethodId,
          bin,
          amount,
          currency,
          installments,
          description,
          payment_type: "single",
          establishment_name: globalSiteName,
          sub_payments: []
        }
        
        axios({
          method: "post",
          url: `${endpoints["makePayment"]}`,
          data: payload,
          headers
        }).then((response) => {
          resolve(response.data)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    /**
    * Get all payments
    * @param {object} filter - The filter object
    * @param {string} [filter.offset] - Offset for pagination.
    * @param {string} [filter.pageSize=20] - Per page items for pagination.
    * @param {string} [filter.siteOperationId] - site_transaction_id 
    * @param {number} [filter.merchantId] - site id
    * @return {Promise}
    */
    this.getPayments = (filter) => {
      return new Promise((resolve, reject) => {
        const {
          offset = 0,
          pageSize = 20,
          siteOperationId,
          merchantId
        } = filter
        let queryStr = ""
        if (offset !== undefined) queryStr += `offset=${offset}&`
        if (pageSize !== undefined) queryStr += `pageSize=${pageSize}&`
        if (siteOperationId !== undefined) queryStr += `siteOperationId=${siteOperationId}&`
        if (merchantId !== undefined) queryStr += `merchantId=${merchantId}&`
        
        axios({
          method: "get",
          url: `${endpoints["paymentsList"]}?${queryStr}`,
          headers
        }).then((response) => {
          resolve(response.data)
        }).catch((err) => {
          reject(err)
        })
      })
    }
    // Payment refund
    this.paymentRefund = (refundPayment) => {
      
    }
  }
}