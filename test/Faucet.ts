import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

let user1:SignerWithAddress;
let owner:SignerWithAddress;

describe("Faucet", function () {

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should deploy the faucet", async function () {
      const FaucetContract = await ethers.getContractFactory('Faucet');
      const Faucet = await FaucetContract.deploy('USDT', 'USDT', 6, 60, 80);
      await Faucet.deployed();

      expect(await Faucet.name()).to.eq("USDT");
      expect(await Faucet.decimals()).to.eq(6);
      expect(await Faucet.backoff()).to.eq(60);
      expect(await Faucet.max()).to.eq(80);
    })

    it("Should mint to a user", async function () {
      const seconds = 43200;
      let value = ethers.utils.parseEther('8000');

      const FaucetContract = await ethers.getContractFactory('Faucet');
      const Faucet = await FaucetContract.deploy('USDT', 'USDT', 6, seconds, value);
      await Faucet.deployed();

      let m = await Faucet.connect(user1).mint(value);

      const balance = await Faucet.balanceOf(user1.address);
      await expect(balance).to.eq(value);

      // 1 mint per 24 hours
      let mm = Faucet.connect(user1).mint(value);
      await expect(mm).to.be.revertedWith('err-backoff');
      const last = await Faucet.lastMint(user1.address);
      expect(last).to.be.above(0);

      ethers.provider.send('evm_increaseTime', [seconds]);
      ethers.provider.send('evm_mine', []);

      mm = Faucet.connect(user1).mint(value);
      await expect(mm).to.not.be.reverted;

      // should not mint over max
      ethers.provider.send('evm_increaseTime', [seconds]);
      ethers.provider.send('evm_mine', []);

      value = ethers.utils.parseEther('8001');
      mm = Faucet.connect(user1).mint(value);
      await expect(mm).to.be.revertedWith('err-max');
    })

    it("Should update the max and backoff", async function () {
      const FaucetContract = await ethers.getContractFactory('Faucet');
      const Faucet = await FaucetContract.deploy('USDT', 'USDT', 6, 60, 80);
      await Faucet.deployed();

      await Faucet.updateBackoff(600);
      expect(await Faucet.backoff()).to.eq(600);

      await Faucet.updateMax(6000);
      expect(await Faucet.max()).to.eq(6000);

      // test ownership
      let x = Faucet.connect(user1).updateBackoff(600);
      await expect(x).to.be.revertedWith('Ownable: caller is not the owner');

      x = Faucet.connect(user1).updateMax(600);
      await expect(x).to.be.revertedWith('Ownable: caller is not the owner');
    })

  })
})

