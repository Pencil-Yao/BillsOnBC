## 1. 启动Fabric网络
```
cd fabric-sample/fabcar
./startFabric.sh
```
**关键提示**在阿里的云服务器上会出现启动失败的现象，错误类型**SIGSEGV**，只需要在basic_network的docker-compose.yml中，对peer,orderer,cli节点配置的environment下添加GODEBUG=netdns=go可以解决问题。
### 验证启动成功
```
docker ps
```
如果看到以下docker启动成功，说明fabcar网络启动成功
```
CONTAINER ID        IMAGE                                                                                                    COMMAND                  CREATED             STATUS              PORTS                                            NAMES
6e3518fe9c6a        dev-peer0.org1.example.com-fabcar-1.0-5c906e402ed29f20260ae42283216aa75549c571e2e380f3615826365d8269ba   "chaincode -peer.add…"   2 minutes ago       Up 2 minutes                                                         dev-peer0.org1.example.com-fabcar-1.0
c985bb186d69        hyperledger/fabric-tools                                                                                 "/bin/bash"              2 minutes ago       Up 2 minutes                                                         cli
deb31626af2b        hyperledger/fabric-peer                                                                                  "peer node start"        3 minutes ago       Up 3 minutes        0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.org1.example.com
34ca36df3344        hyperledger/fabric-couchdb                                                                               "tini -- /docker-ent…"   3 minutes ago       Up 3 minutes        4369/tcp, 9100/tcp, 0.0.0.0:5984->5984/tcp       couchdb
698c6e124c41        hyperledger/fabric-ca                                                                                    "sh -c 'fabric-ca-se…"   3 minutes ago       Up 3 minutes        0.0.0.0:7054->7054/tcp                           ca.example.com
d7cd8ece5ad5        hyperledger/fabric-orderer                                                                               "orderer"                3 minutes ago       Up 3 minutes        0.0.0.0:7050->7050/tcp                           orderer.example.com
```
## 2. 安装网络依赖项
fabcar网络使用到了fabric的node.js SDK，因此输入以下命令安装网络依赖项：
```
npm install
```
## 3. 创建kvstore
kvstore是存放组织中admin用户的身份证书和tls证书的地址，在fabcar中kvstore在.hfc-key-store文件夹内，运行一下命令登记并注册一个admin账户：
```
node enrollAdmin.js
node registerUser.js
```
运行以上命令便可以在该目录下创建一个.hfc-key-store目录。

由于fabric-client.js存在bug问题，我们应当将.hfc-key-sore目录放在主目录下，因此：
```
mv .hfc-key-store ~
```
恭喜，至此**区块链票据**的基础网络已经部署成功了。