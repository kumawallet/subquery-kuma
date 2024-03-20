# SubQuery Kuma projects

This repo contains implementation of [SubQuery](https://github.com/subquery/subql) project for many substrate networks which Kuma wallet supports.

# Get Started

### For local run you can use special script in each network directory
```shell
sh local-runner.sh ${paroject_file}.yaml
```

### In order to deploy new project
```shell
./node_modules/.bin/subql publish -f ${paroject_file}.yaml
```
<!-- ## License
SubQuery Nova is available under the Apache 2.0 license. See the LICENSE file for more info.
© Novasama Technologies GmbH 2023 -->