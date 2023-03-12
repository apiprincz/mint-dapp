import { Button, Grid, Typography } from "@mui/material";
import Head from "next/head";
import React from "react";
import TwitterIcon from "@mui/icons-material/Twitter";
import Link from "next/link";

import Web3Modal from "web3modal";
import { BigNumber, Contract, providers, utils } from "ethers";
import styles from "../styles/Home.module.css";
import { useEffect, useState, useRef } from "react";
import { BUNNIES_CONTRACT_ADDRESS, BUNNIES_CONTRACT_ABI } from "../constants";
import { merkleTree, rootHash } from "../whitelist/merkleProof";
import { keccak256 } from "ethers/lib/utils";
import { toast } from "react-toastify";
import { Progress } from "react-sweet-progress";
import "react-sweet-progress/lib/style.css";
import CallMadeIcon from "@mui/icons-material/CallMade";
import Web3 from "web3";

import WalletConnectProvider from "@walletconnect/web3-provider";

const Home = () => {
  const one = BigNumber.from(1);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();
  const [quantity, setQuantity] = useState(one);
  const [whitelistMintStage, setWhitelistMintStage] = useState(false);
  const [publicMintStage, setPublicMintStage] = useState(false);
  // const [merkleRoot, setMerkleRoot] = useState(rootHash)
  const [loading, setLoading] = useState(false);
  const [mintedForFree, setMintedForFree] = useState(false);
  const [freeMinted, setFreeMinted] = useState(0);
  const [userAddress, setUserAddress] = useState("");
  const [merkleProof, setMerkleProof] = useState([]);
  const [totalAmountMinted, setTotalAmountMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);

  const walletConnectOptions = {
    package: WalletConnectProvider, // required
    options: {
      infuraId: "232319aff64548999468c6dfeef73cfe", // required
    },
  };

  const onPageLoad = async () => {
   
      await getTotalAndMaxSupply();
      await getMintStatus();

    // checkFreeMint()
    getProof();
    console.log("walletConnected", walletConnected);

    console.log("rootHash", rootHash);
  };

  const getProof = async () => {
    const signer = await getProviderOrSigner(true);
    const _userAddress = await signer.getAddress();
    const _leaf = keccak256(_userAddress);
    const _merkleProof = merkleTree.getHexProof(_leaf);
    setUserAddress(_userAddress);
    setMerkleProof(_merkleProof);
  };

  // useEffect(() => {
  //   console.log("walletConnected", walletConnected);

  //   web3ModalRef.current = new Web3Modal({
  //     network: "goerli",
  //     providerOptions: {},
  //     disableInjectedProvider: false,
  //   });

  //   // checkFreeMint()

  // }, [walletConnected]);

  // const getProviderOrSigner = async (isSigner = false) => {
  //   const provider = await web3ModalRef.current.connect();
  //   const web3Provider = new providers.Web3Provider(provider);

  //   const { chainId } = await web3Provider.getNetwork();

  //   if (chainId != 5) {
  //     //   window.alert("Incorrect network, please connect to goerli")
  //     toast("Incorrect network, please connect to goerli", {
  //       hideProgressBar: true,
  //       autoClose: 2000,
  //       type: "error",
  //     });

  //     //   throw new Error("Connect to goerli")
  //   }

  //   if (isSigner) {
  //     const signer = web3Provider.getSigner();
  //     return signer;
  //   }
  //   return web3Provider;
  // };

  const getProviderOrSigner = async (isSigner = false) => {
    const web3Modal = new Web3Modal({
      disableInjectedProvider: false,
      cacheProvider: false, // optional
      providerOptions: {}, // required
    });

    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();

    if (chainId != 5) {
      //   window.alert("Incorrect network, please connect to goerli")
      toast("Incorrect network, please connect to goerli", {
        hideProgressBar: true,
        autoClose: 2000,
        type: "error",
      });

      //   throw new Error("Connect to goerli")
    }

    if (isSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const providerOptions = {
    walletconnect: walletConnectOptions,
  };

  const [web3Account, setWeb3Account] = useState();
  const [web3, setWeb3] = useState();

  const connectWallet = async () => {
    const web3Modal = new Web3Modal({
      disableInjectedProvider: false,
      cacheProvider: false, // optional
      providerOptions: providerOptions, // required
    });
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

    setWeb3(web3);
    setUserAddress(accounts[0]);
    await getProviderOrSigner();
    setWalletConnected(true);
    getTotalAndMaxSupply();
    onPageLoad();
  };

  // const connectWallet = async () => {
  //   try {
  //     await getProviderOrSigner();
  //     localStorage.setItem("isWalletConnected", true);
  //     setWalletConnected(true);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // useEffect(() => {
  //   const connectWalletOnPageLoad = async () => {
  //     if (localStorage?.getItem("isWalletConnected") === "true") {
  //       try {
  //         connectWallet();
  //       } catch (ex) {
  //         console.log(ex);
  //       }
  //     }
  //   };
  //   connectWalletOnPageLoad();
  // }, []);

  const handleIncrement = () => {
    if (quantity < 1) {
      return setQuantity(quantity.add(1));
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      return setQuantity(quantity.sub(1));
    }
  };

  const callWhitelistMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tiddlesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        signer
      );
      const mintPrice = utils.parseEther("0").mul(quantity);

      const tx = await tiddlesContract.whitelistMint(quantity, merkleProof, {
        value: mintPrice,
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      //   window.alert("Mint successful!")
      toast("Mint successful!", {
        hideProgressBar: true,
        autoClose: 2000,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      // Here is the error
      //   window.alert(error)
      toast("unable to mint", {
        hideProgressBar: true,
        autoClose: 2000,
        type: "error",
      });
    }
  };

  const callPublicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tiddlesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        signer
      );

      const mintPrice = utils.parseEther("0").mul(quantity);
      const tx = await tiddlesContract.publicMint(quantity, {
        value: mintPrice,
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      //   window.alert("Mint successful!")
      toast("Mint successful!", {
        hideProgressBar: true,
        autoClose: 2000,
        type: "success",
      });
    } catch (error) {
      console.error(error);
      //Here is the error
      //   window.alert(error)
      toast("unable to mint", {
        hideProgressBar: true,
        autoClose: 2000,
        type: "error",
      });
    }
  };

  const getMintStatus = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tiddlesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        provider
      );
      const _whitelistMintStage = await tiddlesContract.mintPhase();
      if (_whitelistMintStage === 1) {
        setWhitelistMintStage(_whitelistMintStage);
      }
      console.log("_whitelistMintStage", _whitelistMintStage);
      const _publicMintStage = await tiddlesContract.mintPhase();
      if (_publicMintStage === 2) {
        setPublicMintStage(_publicMintStage);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const getTotalAndMaxSupply = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tiddlesContract = new Contract(
        BUNNIES_CONTRACT_ADDRESS,
        BUNNIES_CONTRACT_ABI,
        provider
      );

      const _totalSupply = (await tiddlesContract.totalSupply()).toNumber();
      const _maxSupply = (await tiddlesContract.maxSupply()).toNumber();
      setMaxSupply(_maxSupply);
      setTotalAmountMinted(_totalSupply);
    } catch (error) {
      console.log(error);
    }
  };

  function renderMint() {
    if (whitelistMintStage) {
      if (merkleProof.length > 0) {
        return (
          <Grid
            container
            justifyContent="space-between"
            style={{ minHeight: "65vh" }}
            alignItems="center"
            flexDirection="column"
          >
            <Grid xs={12}>
              <Grid container justifyContent="center" alignItems="center">
                <Grid
                  container
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    borderRadius: "50%",
                    background: "transparent",
                    textAlign: "center",
                    border: "1px solid black",
                    width: "30px",
                    height: "30px",
                    fontSize: "15px",
                  }}
                  onClick={handleDecrement}
                >
                  -
                </Grid>
                <Grid>
                  <input
                    type="number"
                    value={quantity}
                    disabled="disabled"
                    style={{
                      background: "none",
                      height: "100px",
                      border: "none",
                      color: "black",
                      fontSize: "60px",
                      width: "100px",
                      textAlign: "center",
                    }}
                  />
                </Grid>

                <Grid
                  container
                  alignItems="center"
                  justifyContent="center"
                  style={{
                    borderRadius: "50%",
                    background: "transparent",
                    textAlign: "center",
                    border: "1px solid black",
                    width: "30px",
                    height: "30px",

                    fontSize: "15px",
                  }}
                  onClick={handleIncrement}
                >
                  +
                </Grid>
              </Grid>
              <span style={{ fontSize: "14px" }}>1 FREEMINT + gas</span>
            </Grid>
            <Grid xs={12} style={{ width: "90%" }}>
              <p style={{ fontSize: "14px" }}>
                {totalAmountMinted + 140} / {maxSupply} minted
              </p>
              <Grid xs={12}>
                <Progress
                  percent={Math.floor(
                    ((totalAmountMinted + 140) * 100) / maxSupply
                  )}
                />
              </Grid>
            </Grid>
            <Button
              variant="outlined"
              onClick={callWhitelistMint}
              disabled={totalAmountMinted + 140 === maxSupply}
            >
              {totalAmountMinted + 140 === maxSupply ? "Sold Out" : "Mint"}
            </Button>
            <div style={{ fontSize: "16px" }}>
              Congrats! Your Wallet
              <br />
              <span
                style={{
                  fontSize: "14px",
                  wordBreak: "break-all",
                  background: "#8080804f",
                }}
              >
                {userAddress}
              </span>
              <br />
              Is Whitelisted
            </div>
            <span style={{ color: "green", fontSize: "30px" }}>
              WHITELIST MINT IS LIVE
            </span>
          </Grid>
        );
      } else {
        return (
          <Grid
            container
            justifyContent="space-between"
            style={{ minHeight: "65vh" }}
            alignItems="center"
            flexDirection="column"
          >
            <Grid container justifyContent="center" alignItems="center">
              <Grid
                container
                alignItems="center"
                justifyContent="center"
                style={{
                  borderRadius: "50%",
                  background: "transparent",
                  textAlign: "center",
                  border: "1px solid black",
                  width: "30px",
                  height: "30px",
                  fontSize: "15px",
                }}
                onClick={handleDecrement}
              >
                -
              </Grid>
              <Grid>
                <input
                  type="number"
                  value={quantity}
                  disabled="disabled"
                  style={{
                    background: "none",
                    height: "100px",
                    border: "none",
                    color: "black",
                    fontSize: "60px",
                    width: "100px",
                    textAlign: "center",
                  }}
                />
              </Grid>

              <Grid
                container
                alignItems="center"
                justifyContent="center"
                style={{
                  borderRadius: "50%",
                  background: "transparent",
                  textAlign: "center",
                  border: "1px solid black",
                  width: "30px",
                  height: "30px",

                  fontSize: "15px",
                }}
                onClick={handleIncrement}
              >
                +
              </Grid>
            </Grid>
            {}
            <Grid xs={12} style={{ width: "90%" }}>
              <p style={{ fontSize: "14px" }}>
                {totalAmountMinted + 140} / {maxSupply} minted
              </p>
              <Grid xs={12}>
                <Progress
                  percent={Math.floor(
                    ((totalAmountMinted + 140) * 100) / maxSupply
                  )}
                />
              </Grid>
            </Grid>
            <span style={{ fontSize: "15px" }}>Wait For Public</span>
            <div style={{ fontSize: "16px" }}>
              Sorry! Your Wallet
              <br />
              <span
                style={{
                  fontSize: "14px",
                  wordBreak: "break-all",
                  background: "#8080804f",
                }}
              >
                {userAddress}
              </span>
              <br />
              Is not Whitelisted
            </div>
            <span style={{ color: "green", fontSize: "30px" }}>
              WHITELIST MINT IS LIVE
            </span>
          </Grid>
        );
        // return (
        //   <div>
        //     Sorry! Your Wallet
        //     <br />
        //     <span className={styles.address}>{userAddress}</span>
        //     <br />
        //     Is NOT Whitelisted
        //     <br />
        //     You can get one on opensea
        //   </div>
        // );
      }
    }

    if (publicMintStage) {
      return (
        <Grid
          container
          justifyContent="space-between"
          style={{ minHeight: "65vh" }}
          alignItems="center"
          flexDirection="column"
        >
          <Grid xs={12}>
            <Grid container justifyContent="center" alignItems="center">
              <Grid
                container
                alignItems="center"
                justifyContent="center"
                style={{
                  borderRadius: "50%",
                  background: "transparent",
                  textAlign: "center",
                  border: "1px solid black",
                  width: "30px",
                  height: "30px",
                  fontSize: "15px",
                }}
                onClick={handleDecrement}
              >
                -
              </Grid>
              <Grid>
                <input
                  type="number"
                  value={quantity}
                  disabled="disabled"
                  style={{
                    background: "none",
                    height: "100px",
                    border: "none",
                    color: "black",
                    fontSize: "60px",
                    width: "100px",
                    textAlign: "center",
                  }}
                />
              </Grid>

              <Grid
                container
                alignItems="center"
                justifyContent="center"
                style={{
                  borderRadius: "50%",
                  background: "transparent",
                  textAlign: "center",
                  border: "1px solid black",
                  width: "30px",
                  height: "30px",

                  fontSize: "15px",
                }}
                onClick={handleIncrement}
              >
                +
              </Grid>
            </Grid>
            <span style={{ fontSize: "14px" }}>1 FREEMINT + gas</span>
          </Grid>
          {}
          <Grid xs={12} style={{ width: "90%" }}>
            <p style={{ fontSize: "14px" }}>
              {totalAmountMinted + 140} / {maxSupply} minted
            </p>
            <Grid xs={12}>
              <Progress
                percent={Math.floor(
                  ((totalAmountMinted + 140) * 100) / maxSupply
                )}
              />
            </Grid>
          </Grid>
          <Button
            variant="outlined"
            onClick={callPublicMint}
            disabled={totalAmountMinted + 140 === maxSupply}
          >
            {totalAmountMinted + 140 === maxSupply ? "Sold Out" : "Mint"}
          </Button>
          {/* <div style={{ fontSize: "16px" }}>
              Congrats! Your Wallet
              <br />
              <span
                style={{
                  fontSize: "14px",
                  wordBreak: "break-all",
                  background: "#8080804f",
                }}
              >
                {userAddress}
              </span>
              <br />
              Is Whitelisted
            </div> */}
          <span style={{ color: "green", fontSize: "30px" }}>
            PUBLIC MINT IS LIVE
          </span>
        </Grid>
      );
    }
  }

  function renderMintStatus() {
    if (whitelistMintStage) {
      return <span className={styles.stage}>WHITELIST MINT IS LIVE</span>;
    } else if (publicMintStage) {
      return <span className={styles.stage}>PUBLIC MINT IS LIVE</span>;
    } else {
      <span className={styles.stage}> MINT IS NOT LIVE</span>;
    }
  }

  function renderSoldOut() {
    return (
      <div>
     {walletConnected ? <Grid>

      Sold Out!<br></br>
        <Link href="/" className="opensea">
          {" "}
          Get Tiddles on Opensea <CallMadeIcon />
        </Link>

     </Grid> :  <Grid>
     <Button
              onClick={connectWallet}
              variant="contained"
              size="small"
              style={{ backgroundColor: "white" }}
            >
              Connect Wallet
            </Button>
      </Grid>}
     
      </div>
    );
  }
  return (
    <Grid>
      <Head>
        <title>Mint NFT DApp</title>
        <meta name="description" content="Minting DApp" />
        <link rel="icon" href="./bunnies.ico" />
      </Head>
      <Grid
        container
        p={2}
        px={5}
        alignItems="center"
        justifyContent="space-between"
        className="header"
      >
        <Grid>
          <img style={{ width: "70px" }} src="./logo2.png" />
        </Grid>
        <Grid>
          {walletConnected ? (
            <p>
              {userAddress.slice(0, 6)}...{userAddress.slice(38, 42)}
            </p>
          ) : (
            <Button
              onClick={connectWallet}
              variant="contained"
              size="small"
              style={{ backgroundColor: "white" }}
            >
              Connect Wallet
            </Button>
          )}
        </Grid>
      </Grid>
      <Grid container p={5} className='content'>
        <Grid sm={6}>
          <Grid>
            <img
              style={{ width: "40%", borderRadius: " 50%" }}
              src="./tiddles.jpeg"
            />
          </Grid>
          <Grid>
            <h1>
              TIDDLES &nbsp;{" "}
              <img
                style={{ width: "40px", borderRadius: " 50%" }}
                src="./val.png"
              />
            </h1>
          </Grid>
          <Grid py={2}>
            <Typography style={{ color: "#8a2be2c4" }}>
              1414 pixelated tiddles are coming to eth on val's eve to share
              warmth and love. Get ready to adopt them for FREE
            </Typography>
          </Grid>
          <Grid container justifyContent="flex-end">
           
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {/* <Grid className="socials">
              <Link href="/">
                <img src='./opensea.png'/>
              </Link>
            </Grid>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Grid className="socials">
              <Link href="/">
                <TwitterIcon />
              </Link>
            </Grid> */}
          </Grid>
        </Grid>
        <Grid xs={12} sm={9} md={6} style={{ margin: "0 auto" }}>
          <Grid
            sm={12}
            xs={12}
            style={{
              background: "#fe6d8c",
              textAlign: "left",
              borderRadius: "20px",
              color: "white",
            }}
            p={2}
          >
            <Grid style={{ minHeight: "60vh" }}>
              {whitelistMintStage !== 1 && publicMintStage !== 2 ? (
                <Grid
                  style={{
                    minHeight: "60vh",
                    fontSize: "30px",
                    textAlign: "center",
                  }}
                  xs={12}
                  container
                  alignItems="center"
                  justifyContent="center"
                >
                  {/* {renderMint()} */}
                  {/* {totalAmountMinted}
                  {maxSupply}
                  {whitelistMintStage ? 'true' : 'false'} */}

                  {totalAmountMinted + 140 >= maxSupply
                    ? renderSoldOut()
                    : "MINT HAS NOT STARTED"}
                </Grid>
              ) : (
                <Grid>
                  {totalAmountMinted + 140 >= maxSupply
                    ? renderSoldOut()
                    : renderMint()}
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
        <Grid container justifyContent='center' xs={12} py={2} className="socials">
              <Link href="https://twitter.com/tiddlesnft_val">
                <TwitterIcon />
              </Link>
            </Grid>
      </Grid>
    </Grid>
  );
};

export default Home;
