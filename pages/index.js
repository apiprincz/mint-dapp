import { Button, Grid, Typography } from "@mui/material";
import Head from "next/head";
import React from "react";
import TwitterIcon from "@mui/icons-material/Twitter";
import Link from "next/link";

import Web3Modal from "web3modal";
import { BigNumber, Contract, providers, utils } from "ethers";
import styles from "../styles/Home.module.css";
import { useEffect, useState, useRef } from "react";
import { MIRA_CONTRACT_ADDRESS, MIRA_CONTRACT_ABI } from "../constants";
import Countdown from "../components/Countdown";
import { merkleTree, rootHash } from "../whitelist/merkleProof";
import { keccak256 } from "ethers/lib/utils";
import { toast } from "react-toastify";
import { Progress } from "react-sweet-progress";
import "react-sweet-progress/lib/style.css";
import CallMadeIcon from "@mui/icons-material/CallMade";
import Web3 from "web3";

import WalletConnectProvider from "@walletconnect/web3-provider";
import { WHITELIST_ADDRESS } from "@/whitelist/whitelist_Address";

const Home = () => {
  const one = BigNumber.from(1);
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();
  const [quantity, setQuantity] = useState(one);
  const [mintStatus, setMintStatus] = useState(false);

  const [mintStage, setMintStage] = useState(false);

  // const [merkleRoot, setMerkleRoot] = useState(rootHash)
  // const [loading, setLoading] = useState(false);
  const [mintedForFree, setMintedForFree] = useState(false);
  const [freeMinted, setFreeMinted] = useState(0);
  const [userAddress, setUserAddress] = useState("");
  const [merkleProof, setMerkleProof] = useState([]);
  const [totalAmountMinted, setTotalAmountMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isWl, setIsWl] = useState(false);
  const [signature, setSignature] = useState("");
  const [library, setLibrary] = useState("");
  const [network, setNetwork] = useState("");
  const [mintPrice, setMintPrice] = useState("0");

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

    setInterval(() => {
      setLoading(false);
    }, 1000);

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

  const switchNetwork = async () => {
    if (!library) return;

    try {
      // let network = "4"
      // console.log('switch', network, library)

      // await library.provider.request({
      //   method: "wallet_switchEthereumChain",
      //   params: [{ chainId: "5" }],
      // });
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }],
      });
      console.log("switch2", network);
      setNetwork(1);
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[toHex(network)]],
          });
        } catch (error) {
          console.log(switchError);
        }
      }
    }
  };

  const getProviderOrSigner = async (isSigner = false) => {
    const web3Modal = new Web3Modal({
      disableInjectedProvider: false,
      cacheProvider: false, // optional
      providerOptions: {}, // required
    });

    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);
    setLibrary(web3Provider);

    const { chainId } = await web3Provider.getNetwork();
    setNetwork(chainId);

    // if (chainId != 5) {

    //   toast("Incorrect network, please connect to goerli", {
    //     hideProgressBar: true,
    //     autoClose: 2000,
    //     type: "error",
    //   });
    // }
    if (chainId != 1) {
      //   window.alert("Incorrect network, please connect to goerli")
      toast("Incorrect network, please connect to ethereum", {
        hideProgressBar: true,
        autoClose: 2000,
        type: "error",
      });
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
  const [message, setMessage] = useState("Sign wallet to prove ownership");
  const [signedMessage, setSignedMessage] = useState("");

  const connectWallet = async () => {
    const web3Modal = new Web3Modal({
      disableInjectedProvider: false,
      cacheProvider: false, // optional
      providerOptions: providerOptions, // required
    });
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    setLoading(true);

    setWeb3(web3);
    setWalletConnected(true);
    setUserAddress(accounts[0]);
    await getProviderOrSigner();
  };

  const signMessage = async () => {
    if (!library) return;
    try {
      const signature = await library.provider.request({
        method: "personal_sign",
        params: [message, userAddress],
      });
      setSignedMessage(message);
      setSignature(signature);
      getTotalAndMaxSupply();
      onPageLoad();
    } catch (error) {
      setError(error);
    }
  };

  const handleIncrement = () => {
    if (quantity >= 5) {
      setQuantity(quantity);
    } else {
      setQuantity(quantity.add(1));
    }

    if (quantity < 1) {
      return setQuantity(quantity.add(1));
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      return setQuantity(quantity.sub(1));
    }
  };

  useEffect(() => {
    if (quantity) {
      if (mintStatus) {
        if (merkleProof.length > 0) {
          if (mintedForFree) {
            let mintPrice = utils.parseEther("0.0035").mul(quantity);
            console.log("wl", true, mintPrice);

            setMintPrice(mintPrice.toString());
          } else {
            let mintPrice = utils.parseEther("0.0035").mul(quantity - 1);

            console.log("wl", false, mintPrice);

            setMintPrice(mintPrice.toString());
          }
        } else {
          let mintPrice = utils.parseEther("0.0035").mul(quantity);

          setMintPrice(mintPrice.toString());
        }
      }
    }
  }, [quantity]);

  const hasClaimedWhitelist = async () => {
    try {
      let wlState = false;
      const provider = await getProviderOrSigner();
      const miraContract = new Contract(
        MIRA_CONTRACT_ADDRESS,
        MIRA_CONTRACT_ABI,
        provider
      );
      await miraContract.hasClaimedWhitelist(userAddress).then((res) => {
        wlState = res;
        if (res) {
          let mintPrice = utils.parseEther("0.0035");
          setMintedForFree(res);

          setMintPrice(mintPrice.toString());
        } else {
          setMintedForFree(res);
        }
        console.log("res", res);
      });

      return wlState;
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (userAddress) {
      if (merkleProof.length > 0) {
        const wl = hasClaimedWhitelist();
      } else {
        let mintPrice = utils.parseEther("0.0035");

        setMintPrice(mintPrice.toString());
      }
    }
  }, [merkleProof, mintedForFree]);

  const callMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const miraContract = new Contract(
        MIRA_CONTRACT_ADDRESS,
        MIRA_CONTRACT_ABI,
        signer
      );

      console.log("qty", quantity);

      const tx = await miraContract.mint(quantity, merkleProof, {
        value: mintPrice,
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      const wl = hasClaimedWhitelist();

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

  const getMintStatus = async () => {
    try {
      const provider = await getProviderOrSigner();
      const miraContract = new Contract(
        MIRA_CONTRACT_ADDRESS,
        MIRA_CONTRACT_ABI,
        provider
      );
      let mintStage = await miraContract.mintStatus();
      if (mintStage === 1) {
        setMintStatus(true);
      }
      console.log("mintStage", mintStage);
    } catch (error) {
      console.error(error);
    }
  };

  const getTotalAndMaxSupply = async () => {
    try {
      const provider = await getProviderOrSigner();
      const miraContract = new Contract(
        MIRA_CONTRACT_ADDRESS,
        MIRA_CONTRACT_ABI,
        provider
      );

      const _totalSupply = (await miraContract.totalSupply()).toNumber();
      const _maxSupply = (await miraContract.maxSupply()).toNumber();
      setMaxSupply(_maxSupply);
      setTotalAmountMinted(_totalSupply);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (userAddress) {
      const wlAddress = WHITELIST_ADDRESS.includes(userAddress);
      setIsWl(wlAddress);
      console.log("wlAddress", wlAddress);
    }
  }, [userAddress]);

  function renderMint() {
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
          <span style={{ fontSize: "14px" }}>
            {utils.formatEther(mintPrice)} Eth + gas
          </span>
        </Grid>
        <Grid xs={12} style={{ width: "90%" }}>
          <p style={{ fontSize: "14px" }}>
            {totalAmountMinted + 0} / {maxSupply} minted
          </p>
          <Grid xs={12}>
            <Progress
              percent={Math.floor(((totalAmountMinted + 0) * 100) / maxSupply)}
            />
          </Grid>
        </Grid>
        <Button
          variant="outlined"
          onClick={callMint}
          disabled={totalAmountMinted + 0 === maxSupply}
        >
          <span style={{ color: "white" }}>
            {totalAmountMinted + 0 === maxSupply ? "Sold Out" : "Mint"}
          </span>
        </Button>

        <div style={{ fontSize: "16px" }}>
          {merkleProof.length > 0 ? (
            <>
              {" "}
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
            </>
          ) : (
            <> {userAddress}</>
          )}
        </div>
        <span style={{ color: "green", fontSize: "30px" }}>MINT IS LIVE</span>
      </Grid>
    );
  }

  function renderMintStatus() {
    if (mintStatus) {
      return <span className={styles.stage}> MINT IS LIVE</span>;
    } else {
      <span className={styles.stage}>
        <Countdown />
        MINT IS NOT LIVE
      </span>;
    }
  }

  function renderSoldOut() {
    return (
      <div>
        {walletConnected ? (
          <>
            {network !== 1 ? (
              <Button
                variant="outlined"
                onClick={switchNetwork}
                disabled={network === 1}
              >
                switch to ETH Network
              </Button>
            ) : (
              <>
                {!mintStatus ? (
                  <Grid>Mint Is Not Live Yet</Grid>
                ) : (
                  <Grid>
                    Sold Out!<br></br>
                    <Link href="https://opensea.io/collection/mira-on-chain" className="opensea">
                      {" "}
                      Get Mira onChain on <a href="https://opensea.io/collection/mira-on-chain">Opensea</a>{" "}
                      <CallMadeIcon />
                    </Link>
                  </Grid>
                )}
              </>
            )}
          </>
        ) : (
          <Grid>
            {/* <Countdown /> */}

            <Button
              onClick={connectWallet}
              variant="contained"
              size="small"
              style={{ backgroundColor: "white" }}
            >
              Connect Wallet
            </Button>
          </Grid>
        )}
      </div>
    );
  }
  return (
    <Grid>
      <Head>
        <title>Mint NFT DApp</title>
        <meta name="description" content="Mira Onchain Minting DApp" />
        <link rel="icon" href="./mira.ico" />
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
              {signedMessage ? (
                <>
                  {network !== 1 && (
                    <Button
                      variant="outlined"
                      onClick={switchNetwork}
                      disabled={network === 1}
                    >
                      switch to ETH Network
                    </Button>
                  )}
                  {userAddress.slice(0, 6)}...{userAddress.slice(38, 42)}
                </>
              ) : (
                <>
                  {network !== 1 ? (
                    <Button
                      variant="outlined"
                      onClick={switchNetwork}
                      disabled={network === 1}
                    >
                      switch to ETH Network
                    </Button>
                  ) : (
                    <Button style={{ color: "skyblue" }} onClick={signMessage}>
                      Sign Message
                    </Button>
                  )}
                </>
              )}
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
      <Grid container p={5} className="content">
        <Grid sm={6}>
          <Grid>
            <img
              style={{ width: "40%", borderRadius: " 50%" }}
              src="./logo.jpg"
            />
          </Grid>
          <Grid>
            <h1>Mira onChain &nbsp; </h1>
          </Grid>
          <Grid py={2}>
            <Typography style={{ color: "#8a2be2c4" }}>
              5000 fully Onchain Hues. Color your world with Mira Onchain
            </Typography>
          </Grid>
          <Grid container justifyContent="flex-end">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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
              {!mintStatus ? (
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
                  {loading ? (
                    <Grid>
                      {walletConnected ? (
                        <p>
                          {!signedMessage && (
                            <>
                              {" "}
                              {network !== 1 ? (
                                <Button
                                  variant="outlined"
                                  onClick={switchNetwork}
                                  disabled={network === 1}
                                >
                                  switch to ETH Network
                                </Button>
                              ) : (
                                <Button onClick={signMessage}>
                                  <span style={{ color: "white" }}>
                                    Sign Message
                                  </span>
                                </Button>
                              )}
                            </>
                          )}{" "}
                        </p>
                      ) : (
                        <> Loading...</>
                      )}
                    </Grid>
                  ) : (
                    <>
                      {totalAmountMinted + 0 >= maxSupply ? (
                        renderSoldOut()
                      ) : (
                        <Grid>
                          MINT HAS NOT STARTED <br />
                          {isWl ? (
                            <>Your Address is Whitelisted </>
                          ) : (
                            <>Your address is not on the whitelist</>
                          )}
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              ) : (
                <Grid>
                  {loading ? (
                    <Grid>Loading...</Grid>
                  ) : (
                    <>
                      {totalAmountMinted + 0 >= maxSupply ? (
                        <>
                          {network !== 5 ? (
                            <>
                              <Button
                                variant="outlined"
                                onClick={switchNetwork}
                                disabled={network === 1}
                              >
                                switch to Eth Network
                              </Button>
                            </>
                          ) : (
                            renderSoldOut()
                          )}{" "}
                        </>
                      ) : (
                        renderMint()
                      )}
                    </>
                  )}
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
        <Grid
          container
          justifyContent="center"
          xs={12}
          py={2}
          className="socials"
        >
          <a href="https://opensea.io/collection/mira-on-chain">
            <img style={{width:'22px'}} src="./opensea.png"/>
            </a>&nbsp;
      
          <Link href="https://twitter.com/Mira_Onchain">
            <TwitterIcon />
          </Link>

        </Grid>
      </Grid>
    </Grid>
  );
};

export default Home;
