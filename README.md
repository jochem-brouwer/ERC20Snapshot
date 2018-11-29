ERC20 Snapshotter using Merkle Proofs
========

Overview
--------

This is sample use case of using Merkle Proofs to let users verify that data was part of a certain dataset on-chain where not the entire database has to be uploaded on chain.

A good use case for this rather abstract problem is the case where an ERC20 contract has a bug and has to be re-deployed. The naive way to do this is to create a snapshot at a certain block and when redeploying this contract the owner has to write the balances of each address to storage. This will cost the owner a lot of gas. Imagine that 1000 addresses have a balance: this means that at least 20k * 1k = 20M gas is used on storage writes alone (forgetting about the fact that the gas paid on calldata is also not neglible!). As of now, this means that minimally 2.5 full ETH blocks have to be filled in order to write this storage.

Another way to do this is to let users who actually wish to claim their tokens pay for gas. This rules out that the owner has to pay for addresses who either have a micro amount of tokens or addresses who forgot their private key or simply forgot they had tokens. A way to do this is to setup a centralized server and let this server give the user a signed message which the user can then send on-chain: the chain will now verify that the owner has indeed signed this message (via `ecrecover`) and then the chain will give the user the tokens. However, this centralized the entire product, since the owner can now mint themselves any amount of tokens. Users who wish to claim their tokens need to communicate with this server, which also means this server has to be online forever.

It is clear that above two solutions have problems: it is either the gas cost or it centralized the product. It is debatable if the users have to pay for the gas to reclaim their tokens if a bug is discovered in the contract - it is also fair if the creator themselves pay for this. However, this might also clog the chain with dust tokens which are being left behind.

The solution is to create a Merkle Tree of all addresses and their balances at a certain block and then uploading the Merkle Root to a new contract. Users can now themselves verify that this Merkle Root is indeed correct: they only need to know what block number was used to take the snapshot, what sorting algorithm was used (to sort the nodes) and of course their balances. Hence having contact with any ETH full node is now sufficient. 

Implementation
---------

The `Snapshot` module interfaces with any ERC20 contract and reads `Transfer` events to build a list of addresses which might have tokens. It is created by providing the ERC20 contract address, the block number this contract was created, and a web3 module connected to a node. 

Calling `getRootHash(blockNumber)` of `Snapshot` creates the Merkle Root of the provided ERC20 address at a certain block number. Now the `ERC20Snapshot` contract can be deployed where relevant data as the root hash and the ERC20 symbols/numbers/total supply/decimals have to be provided. Of course this can be edited. 

If an user now wishes to claim their tokens, they have to setup their own version of the `Snapshot` module and now they call `getClaimTX` where they provide th block number the snapshot was taken on and their account address. This returns a web3 TX which can then be signed by any address and then sent on-chain.

Users can only claim their tokens once. 

If the user tries to upload a forged Merkle Proof the transaction is rejected as the final hash the proof creates is not equal to the root hash of the contract.

Gas
-----

The gas usage of a claim transaction depends on the size of the merkle proof (and is hence dependent on log2(accounts.length) where accounts is a list of all accounts who ever interacted with the contract). A test is included where 6 addresses are part of the merkle tree: the gas usage of accounts who have tokens is about 80k gas. If the size of the addresses goes up, users will have to pay slightly more on calldata and on showing on-chain that their merkle proof is correct, but this will not be a lot: every new merkle "layer" adds 2 items to calldata (one bytes32: 68*32 = 2172 gas + one bool: max 192 gas). This adds some extra gas on memory management and an extra SHA3. More tests have to be added to figure out how this scales.