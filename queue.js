var axios = require('axios')
var Queue = require('bull');

var messageQueue = new Queue('messages', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
  }
}); // Specify Redis connection using object

var requestQueue = new Queue('request', {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
  }
})

messageQueue.process(parseInt(process.env.CONCURRENCY) || 5, async function(job){
  if(job.attemptsMade >= process.env.MAX_RETRIES - 1) {
    try {
      console.log('Request Failed.')
      requestQueue.add({request_id: job.data.request_id, status: 'failed'}, {
        backoff: {
          type: 'exponential',
          delay: 100,
        },
      })
      // await models.Request.updateOne({_id: job.data.request_id}, {status: 'failed'})
    }
    catch(err) {
      console.log('unable to update DB')
    }
  }
  await sendCallback(job.data)
});

async function sendCallback(params) {
  return new Promise(async function(resolve, reject) {
    const { url, API_key, payload, test, request_id } = params
    try {
      const data = {API_key, test: test?true:false, payload: payload, id: request_id}
      axios.post(url, data).then(async ack => {
        console.log(`Notification successfully sent to: ${url}, Request ID: ${request_id}`)
        try {
          requestQueue.add({request_id: request_id, status: 'sent'}, {
            backoff: {
              type: 'exponential',
              delay: 100,
            },
          })
          // await models.Request.updateOne({_id: request_id}, {status: 'sent'})
        }
        catch(err) {
          console.log('unable to update DB')
        }
        if(ack) return resolve(ack)//done()
        // return resolve(ack)
      }).catch(err => {
        console.log(`Notification sending failed. Retrying, Request ID: ${request_id}`)
        reject(err)
      })
    }
    catch(err) {
      console.log(err)
      // return reject(err)
    }
  })
}

module.exports = messageQueue