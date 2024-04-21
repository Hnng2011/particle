import { useState, useEffect, useMemo, useCallback } from 'react';
import { ParticleNetwork } from "@particle-network/auth";
import { SmartAccount } from '@particle-network/aa';
import { EthereumSepolia } from "@particle-network/chains";
import { ethers } from 'ethers';
import './App.css';
import { ParticleProvider } from '@particle-network/provider';

const config = {
  projectId: "1315bb86-19f3-4f6e-9a12-31eab7b2ec3f",
  clientKey: "cRQE7UFsZGSn1PsZyJJ9XdH0yBJMNbuSke9QBUNu",
  appId: "42256ba6-4b68-4119-898b-8073aaf73d50",
};

const particle = new ParticleNetwork({
  ...config,
  chainName: EthereumSepolia.name, // Optional: resolves to 'ethereum' both in this case & by default
  chainId: EthereumSepolia.id, // Optional: resolves to 1 both in this case & by default
  wallet: {
    preload: true,  // Optional: object controlling additional configurations
    displayWalletEntry: true,  // Whether or not the wallet popup is shown on-screen after login // If the former is true, the position in which the popup appears
    uiMode: "dark",  // Light or dark, if left blank, aligns with web auth default
    supportChains: [{ id: EthereumSepolia.id, name: EthereumSepolia.name }], // Restricts the chains available within the web wallet interface
    customStyle: { evmSupportWalletConnect: true, }, // If applicable, custom wallet style in JSON
  },
});

const provider = new ethers.providers.Web3Provider(new ParticleProvider(particle.auth));

const smartAccount = new SmartAccount(new ParticleProvider(particle.auth), {
  ...config,
  aaOptions: {
    accountContracts: {
      SIMPLE: [
        {
          version: '1.0.0',
          chainIds: [EthereumSepolia.id],
        }
      ],
    },
  },
});

smartAccount.setSmartAccountContract({ name: 'SIMPLE', version: '1.0.0' });

async function getNonce(address: any, setSignedMessage: any) {
  const add = address.toString().toLowerCase();
  const fetchData = async () => {
    try {
      const response = await fetch(`https://auth.matrixai.click/api/v1/get-msg?address=${add}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },

      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setSignedMessage(String(data.message));
    } catch (error) {
      console.log('error', error);
    } finally {
      console.log('Success');
    }
  };

  fetchData();
};

async function postNonce(msg: any, setSignedMessage: any) {
  const postData = async () => {
    try {
      const response = await fetch(`https://auth.matrixai.click/api/v1/get-jwt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1000',
        },
        body: JSON.stringify({ signature: setSignedMessage, msg: msg }),

      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      localStorage.clear();
      window.location.href = `https://cinny-nine.vercel.app/login/matrixai.click?loginToken=${data.token}`;
    } catch (error) {
      console.log('error', error);
    } finally {
      console.log('Success');
    }
  };

  postData();
};

const App = () => {
  const [aaAccount, setAAAccount] = useState<any>(null);
  const [msg, setMsg] = useState<any>('');
  particle.setERC4337({ name: 'SIMPLE', version: '1.0.0' });

  const handleLogin = async (preferredAuthType: any) => {
    await particle.auth.login({ preferredAuthType });
    const addressA = await smartAccount.getAddress();
    setAAAccount(addressA)
  };

  useEffect(() => {
    async function LoadMessage() {
      aaAccount && await getNonce(aaAccount, setMsg);
    }

    LoadMessage();
  }, [aaAccount])

  useEffect(() => { msg && signAddress() }, [msg]);


  useEffect(() => {
    return () => {
      localStorage.clear();
      delete window.particle;
    };
  }, []);


  const signAddress = useCallback(async () => {
    const signature = await provider.getSigner().signMessage(msg);
    await provider.getSigner().getAddress();
    await postNonce(msg, signature);
  }, [aaAccount, msg]);

  return (
    <div className="App">
      <div className="logo-section">
        <img src="https://i.imgur.com/EerK7MS.png" alt="Logo 1" className="logo logo-big" />
        <img src="https://i.imgur.com/9gGvvtO.png" alt="Logo 2" className="logo" />
      </div>

      {!aaAccount && (
        <div className="login-section">
          <button className="sign-button" onClick={() => handleLogin('google')}>Sign in with Google</button>
          <button className="sign-button" onClick={() => handleLogin('twitter')}>Sign in with Twitter</button>
        </div>
      )
        // : (
        // <div className="profile-card">
        //   <h2>{userInfo.name}</h2>
        //   <div className="balance-section">
        //     <small>{ethBalance} ETH</small>
        //     {isDeployed ? (
        //       <button className="sign-message-button" onClick={executeUserOp}>Execute User Operation</button>
        //     ) : (
        //       <button className="sign-message-button" onClick={deployAccount}>Deploy Account</button>
        //     )}
        //   </div>
        // </div>
        // )
      }

      <div>{aaAccount}</div>
    </div>
  );
};

export default App;