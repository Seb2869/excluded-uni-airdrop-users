#!/usr/bin/env node

import {JsonRpcProvider} from "ethers/providers";
import { UniswapV2Pair } from './UniswapV2Pair'
import { UniswapV2PairFactory } from './UniswapV2PairFactory'

const fs = require('fs')
const argv = require('yargs')
  .option('output', {
    alias: 'o',
    describe: 'output file',
    default: 'accounts.txt'
  })
  .option('endpoint', {
    alias: 'e',
    default: 'http://localhost:8545',
    describe: 'Ethereum rpc endpoint.'
  })
  .argv

const provider = new JsonRpcProvider(argv.endpoint)
const knownTxs = [
  '0x6e905c38578b4758423b25ad07431448c1307b414d30a1412bdaf3992780eabc',
  '0x24c67f628a42284ab7225576580841fb3c1c5576edc978666f019ed63c73046d',
  '0x3ce39ddc5cbad5fd03776fc14a058f60b93ac07647c5f6159ba43731d16bfad9',
  '0x146b07dc9b8352535b3367c18637316f87337b5c25b3634e9f7b80e4019e1b1b',
  '0xfd0ccba40f1e3e11f5c5eb6ff0e0648f5f29da8d2e27383f8a415d0c3ebd0556',
  '0x5600e75e92431c394930b6e35687bf7c5c7f13beb4c1f9745364c21865b1c1af',
  '0x2063ace228c6f0c6f108bf504b4c5adef3973f2dc5d3b4a9004b2a51d9926b9c',
  '0x882663c5b079fc459c88b68929d694c252f5745c157d397c80230da7279a0338',
  '0xb8ba3e9b32f79f58b8172f6a171779d3685ef48a7902010640364b5ee8a5e838',
  '0xbdab83bc6e3a9d72a95f5e9919710dc7735ceae879838ff350d36948a4726f38',
  '0x4b5856a16fefadb25f3b539caf9827d9e934c11f3fa67f3aecf46ffd8d7d574a',
  '0xad38e656e7c2274deff7b5fb11a8eab4ed3399a02b36db718d3064af336597e8',
  '0x68dd5f20a8ebb05209981e34a5756a8edc7a80b78f23f1f6007e63654efd6723',
  '0x6540378221153185ff02ffcaa53a34f0e9763726f4157a15a43606c4cf42ef5d',
  '0xe5977f0ed48267c3282a0e3c39578b67ccf8ddcfdf90f6f1c48985eec8c35786',
  '0xd9fd09487bc5ea9c79ce3f81191f726f6639b1ef716ced1e900dba066ad8896b',
  '0x1f4e8ed604754abfdc608d59c1a79b88fda2dc72a9f14660bfceab4eb3d8daeb',
  '0x968dff03d06c56e9f662ea10d474f3a172a3620e38a78bf9f63f8c23e0b9dde8',
  '0x74c0963dd92c1c81a66b3fd8c2c711abd0c426b0ff2cbb2d2f94ed15892fd432',
  '0x0ba594440a417c7c03a170c26bf653af04c0a0159f1b038d1ef118a327f06580',
  '0x7adcab8b5a6846e9523aa9e24e212080ff371e8870c4240e19d5c3d94f56f5f8',
  '0xf9e50dff5b439641b80452eacccc605be96c6dc5b6d937e1c2a62030342e98a4',
  '0x1481d760b4e32c28b74fdd80e6e2887206323922e799e25dd7d9ad48a324e2fa',
  '0x405ac268adbdaeaa107633dabfc76513154e3965db86af9ba054582af3dd883a',
  '0x94ef95cb676cdfdd67e2a54f8d821a595bd82fd89681bdd6e75e37ba0da9d555',
  '0x891a161f69eff31f3dc4f8916824a15acc78e8d715b2a30db6ac4b08e0c3ab5b',
  '0x542070a2ecdb4b5b892a55860ca69d688883ea7c8616ed346c7f2b577432a5e7',
  '0x470f72fb0859bda5f74f71bce6ea1e4e2b3a4feb1eb3eb1d0e6226ff66992c16',
  '0xb4831dfa50f00d4a6846f4610583cfc8616f6c35141ce41ca2213b78318ccbcc',
  '0xe3b7e4a4a270bdab7a49e89d23234dbb9323c16805f8f7604c0474fe6363c2a3',
  '0x64344dba39e69994aa6ce977f6728df5a5f158505ab3a22e4f70d5bd2fc00881',
  '0x6e2b98e2af57412af91b7f095738dff1b39a284ec5f9456f726e8065f6d2b01b',
  '0x9e11919982e7e9cecafb45d667ffb7e77be1c780bffa1f836b3d897db11b02cc',
  '0xaa734377a1d88f7c7b900d2e3743c63de90154be27c5b2cfc2394146e68379e0',
  '0xc377072b8348bd53ae583e0fb5841aa27458180c821e78324cb04e4298647bad',
]

const error = (msg) => {
  console.error(msg)
  process.exit(1)
}

const writeLine = (outstream, line) => {
  outstream.cork()
  outstream.write(line)
  outstream.write('\n')
  outstream.uncork()
}

const start = async () => {
  const outstream = fs.createWriteStream(argv.output)

  console.log(`writing addresses list to ${argv.output}`)
  const pairContract = UniswapV2PairFactory.connect("0xc85cdd3240385af9958ef99bc2ff0c4de5640bcb", provider)
  const iface = pairContract.interface

  const validAddresses = new Set()
  for (let txHash of knownTxs) {
    console.log('processing tx', txHash)
    const receipt = await provider.getTransactionReceipt(txHash)
    let toAddr
    for (const log of receipt.logs) {
      const logDescription = iface.parseLog(log)

      if(logDescription?.name === iface.events.Swap.name) {
        console.log('uniswap swap', logDescription)
        toAddr = logDescription.values.to
        console.log(`address found: ${toAddr} - transaction: ${receipt.transactionHash}`)
        if(!validAddresses.has(toAddr)) {
          validAddresses.add(toAddr)
          writeLine(outstream, toAddr)
        }
      }
    }
  }
  outstream.end()
  console.log('Done.')
}

start()
  .then(() => process.exit(0))
  .catch(error)
