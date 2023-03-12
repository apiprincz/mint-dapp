import Head from "next/head"
import Web3Modal from "web3modal"
import { BigNumber, Contract, providers, utils } from "ethers"
import styles from "../styles/Home.module.css"
import { useEffect, useState, useRef } from "react"
import { BUNNIES_CONTRACT_ADDRESS, BUNNIES_CONTRACT_ABI } from "../constants"
import { merkleTree, rootHash } from "../whitelist/merkleProof"
import { keccak256 } from "ethers/lib/utils"
import { toast } from "react-toastify";


export default function Home() {
  const one = BigNumber.from(1)
  const [walletConnected, setWalletConnected] = useState(false)
  const web3ModalRef = useRef()
  const [quantity, setQuantity] = useState(one)
  const [whitelistMintStage, setWhitelistMintStage] = useState(false)
  const [publicMintStage, setPublicMintStage] = useState(false)
  // const [merkleRoot, setMerkleRoot] = useState(rootHash)
  const [loading, setLoading] = useState(false)
  const [mintedForFree, setMintedForFree] = useState(false)
  const [freeMinted, setFreeMinted] = useState(0)
  const [userAddress, setUserAddress] = useState("")
  const [merkleProof, setMerkleProof] = useState([])
  const [totalAmountMinted, setTotalAmountMinted] = useState(0)
  const [maxSupply, setMaxSupply] = useState(0)

  const onPageLoad = async() => {
    setInterval(async() => {
      await getTotalAndMaxSupply()
      await getMintStatus()
    }, 5 * 1000)
    // checkFreeMint()
    getProof()
    console.log("rootHash",rootHash)
  }

  const getProof = async() => {
    const signer = await getProviderOrSigner(true)
    const _userAddress = await signer.getAddress()
    const _leaf = keccak256(_userAddress)
    const _merkleProof = merkleTree.getHexProof(_leaf)
    setUserAddress(_userAddress)
    setMerkleProof(_merkleProof)
  }

  useEffect(() => {
    web3ModalRef.current = new Web3Modal({
      network: "goerli",
      providerOptions: {},
      disableInjectedProvider: false
    })
    // checkFreeMint()
    getTotalAndMaxSupply()
    onPageLoad()
  }, [walletConnected])


  const getProviderOrSigner = async(isSigner = false) => {
    const provider = await web3ModalRef.current.connect()
    const web3Provider = new providers.Web3Provider(provider)

    const { chainId } = await web3Provider.getNetwork()

    if(chainId != 1) {
    //   window.alert("Incorrect network, please connect to goerli")
      toast('Incorrect network, please connect to ethereum', { hideProgressBar: true, autoClose: 2000, type: 'error' })

    //   throw new Error("Connect to goerli")
    }

    if(isSigner) {
      const signer = web3Provider.getSigner()
      return signer
    }
    return web3Provider
  }

  const connectWallet = async() => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)
    } catch (error) {
      console.error(error)
    }
  }

  const handleIncrement = () => {
    if(quantity < 1){
      return(
        setQuantity(quantity.add(1))
      )
    }
  }

  const handleDecrement = () => {
    if(quantity > 1){
      return(
        setQuantity(quantity.sub(1))
      )
    }
  }

  const getMintStatus = async() => {
    try {  
      const provider = await getProviderOrSigner()
      const bunniesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        provider
      )
      const _whitelistMintStage = await bunniesContract.whitelist_MintEnabled()
      setWhitelistMintStage(_whitelistMintStage)
      const _publicMintStage = await bunniesContract.public_MintEnabled()
      setPublicMintStage(_publicMintStage)
    } catch (error) {
      console.error(error)
    }
  }

//   const checkFreeMint = async() => {
//     try {
//       const provider = await getProviderOrSigner()
//       const bunniesContract = new Contract(
//         BUNNIES_CONTRACT_ADDRESS,
//         BUNNIES_CONTRACT_ABI,
//         provider
//       )
//       const hasMintedFree = await bunniesContract.mintedFree(userAddress)
//       console.log(hasMintedFree)
//       setMintedForFree(hasMintedFree)
//     } catch (error) {
//       console.error(error)
//     }
//   }


  const callWhitelistMint = async() => {
    try {
      const signer = await getProviderOrSigner(true)
      const bunniesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        signer
      )
      const mintPrice = utils.parseEther("0").mul(quantity)

      const tx = await bunniesContract.mint(
        quantity,
        merkleProof,
        {
          value: mintPrice
        }
      )
      setLoading(true)
      await tx.wait()
      setLoading(false)
    //   window.alert("Mint successful!")
      toast('Mint successful!', { hideProgressBar: true, autoClose: 2000, type: 'success' })

    } catch (error) {
      console.error(error)
      // Here is the error
    //   window.alert(error)
      toast('unable to mint', { hideProgressBar: true, autoClose: 2000, type: 'error' })

    }
  }

  const callPublicMint = async() => {
    try {
      const signer = await getProviderOrSigner(true)
      const bunniesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        signer
      )
      
      const mintPrice = (utils.parseEther("0").mul(quantity))
      const tx = await bunniesContract.publicMint(
        quantity,
        {
          value: mintPrice
        }
      )
      setLoading(true)
      await tx.wait()
      setLoading(false)
    //   window.alert("Mint successful!")
      toast('Mint successful!', { hideProgressBar: true, autoClose: 2000, type: 'success' })

    } catch (error) {
      console.error(error)
      //Here is the error
    //   window.alert(error)
      toast('unable to mint', { hideProgressBar: true, autoClose: 2000, type: 'error' })

    }
  }

  const getTotalAndMaxSupply = async() => {
    try {
      const provider = await getProviderOrSigner()
      const bunniesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        provider
      )

      const _totalSupply = (await bunniesContract.totalSupply()).toNumber()
      const _maxSupply = (await bunniesContract.maxSupply()).toNumber()
      setMaxSupply(_maxSupply)
      setTotalAmountMinted(_totalSupply)
    } catch (error) {
      console.log(error)
    }
  }

  function renderMint() {
    if(whitelistMintStage) {
      if(merkleProof.length > 0) {
        return (
          <div>
            <div className={styles.input_div}>
              <button className={styles.button} onClick={handleDecrement}>-</button>
              <input
                className={styles.input}
                type="number"
                value={quantity}
                disabled="disabled"
              />
              <button className={styles.button} onClick={handleIncrement}>+</button>
            </div>
            {}
            <button className={styles.mint_button} onClick={callWhitelistMint}>Mint</button>
            <div>
              Congrats! Your Wallet
              <br/>
              <span className={styles.address}>{userAddress}</span> 
              <br/>
              Is Whitelisted
            </div>
          </div>
        )
      }else {
        return(
          <div>
            Sorry! Your Wallet
            <br/>
            <span className={styles.address}>{userAddress}</span>
            <br/>
            Is NOT Whitelisted
            <br/>
            You can get one on opensea
          </div>
        )
      }
    }

    if(publicMintStage) {
      return(
        <div>
            <div className={styles.input_div}>
              <button className={styles.button} onClick={handleDecrement}>-</button>
              <input
                className={styles.input}
                type="number"
                value={quantity}
                disabled="disabled"
              />
              <button className={styles.button} onClick={handleIncrement}>+</button>
            </div>
            <button className={styles.mint_button} onClick={callPublicMint}>Mint</button>
        </div>
      )
    }
  }

  function renderMintStatus() {
    if(whitelistMintStage) {
      return(
        <span className={styles.stage}>WHITELIST MINT</span>
      )
    } else if(publicMintStage){
      return(
        <span className={styles.stage}>PUBLIC MINT</span>
      )
    } else {
      <span className={styles.stage}> MINT IS NOT LIVE</span>
    }
  }

  function renderSoldOut() {
      return(
        <div className={styles.title}>
          Sold Out!
        </div>
      )
  }

  return(
    <div className={styles.container}>
    <Head>
      <title>Bunnies NFT</title>
      <meta name="description" content="Bunnies Minting dApp" />
      <link rel="icon" href="./bunnies.ico" />
    </Head>
    <div className={styles.navbar}>
      <div>
        <a href='https://bunniesinchina.com/'>
        <img className={styles.logoTop} src="./logo2.png" />

        </a>
      </div>
      {walletConnected ? (
        <p className={styles.connect}>
          {userAddress.slice(0, 6)}...{userAddress.slice(38, 42)}
        </p>
      ) : (
        <button className={styles.button} onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>

    <div className={styles.main}>
      <div className={styles.main_container}>
        <div className={styles.image}>
          <img className={styles.logo} src="./bunnies.png" />
        </div>
        <div className={styles.description}>
          <div>
          <h1 className={styles.title}>BUNNIES NFT</h1>
          {/* <p className={styles.description}>
            Bunnies NFT is a degen collection made for true degens
          </p> */}
          <br/>
          <div >
            <p>Mint Stage : {renderMintStatus()} </p>
            {/* <p>Mint Stage : MINT IS NOT LIVE </p> */}
            {/* <p>
              {totalAmountMinted} / {maxSupply} have been minted

            </p> */}
            <p>{totalAmountMinted + 50} / {maxSupply} have been minted</p>
            {/* <p>{displayPrice}</p> */}
          </div>
          </div>
          {!(totalAmountMinted + 50 >= maxSupply) ? renderSoldOut() : renderMint()}
          
        </div>
      </div>
    </div>

    <footer className={styles.footer}>
      <div className={styles.socials}>
        <div className={styles.icon_div}>
          <img className={styles.icon} src="./twitter.png" />
          <a href="https://mobile.twitter.com/BunniesInChina" target="blank">
            twitter
          </a>
        </div>&nbsp;&nbsp;&nbsp;&nbsp;

        <div className={styles.icon_div}>
          <img className={styles.icon} src="./opensea.png" />
          <a href="https://opensea.io/collection/bunnies-in-china/" target="blank">
            opensea
          </a>
        </div>
      </div>
      <div>
        Made with 💙 for NFT degens!{" "}
        <span className={styles.copy}>&copy;</span>2023
      </div>
    </footer>
  </div>
  )
}