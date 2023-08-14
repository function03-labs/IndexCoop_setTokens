export const tradeModuleAbi = [
  {
    inputs: [
      {
        internalType: "contract IController",
        name: "_controller",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract ISetToken",
        name: "_setToken",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_sendToken",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_receiveToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "contract IExchangeAdapter",
        name: "_exchangeAdapter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_totalSendAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_totalReceiveAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "_protocolFee",
        type: "uint256",
      },
    ],
    name: "ComponentExchanged",
    type: "event",
  },
  {
    inputs: [],
    name: "controller",
    outputs: [
      { internalType: "contract IController", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISetToken",
        name: "_setToken",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "removeModule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract ISetToken",
        name: "_setToken",
        type: "address",
      },
      { internalType: "string", name: "_exchangeName", type: "string" },
      { internalType: "address", name: "_sendToken", type: "address" },
      { internalType: "uint256", name: "_sendQuantity", type: "uint256" },
      { internalType: "address", name: "_receiveToken", type: "address" },
      { internalType: "uint256", name: "_minReceiveQuantity", type: "uint256" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "trade",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
