<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  S3 driver for Factory drive module from NestJS framework
</p>

<p align="center">
  <a href="https://www.npmjs.com/org/tacxou"><img src="https://img.shields.io/npm/v/@tacxou/nestjs_module_factorydrive-s3.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/org/tacxou"><img src="https://img.shields.io/npm/l/@tacxou/nestjs_module_factorydrive-s3.svg" alt="Package License" /></a>
  <a href="https://github.com/tacxou/nestjs_module_factorydrive-s3/actions/workflows/ci.yml"><img src="https://github.com/tacxou/nestjs_module_factorydrive-s3/actions/workflows/ci.yml/badge.svg" alt="Publish Package to npmjs" /></a>
  <a href="https://codecov.io/gh/tacxou/nestjs_module_factorydrive"><img src="https://codecov.io/gh/tacxou/nestjs_module_factorydrive/graph/badge.svg?token=KK6LY0DZ4p"/></a>
  <a href="https://github.com/tacxou/nestjs_module_factorydrive-s3/actions/workflows/release.yml?event=workflow_dispatch"><img alt="GitHub contributors" src="https://github.com/tacxou/nestjs_module_factorydrive-s3/actions/workflows/release.yml/badge.svg"></a>
</p>
<br>

# S3 driver for Factory drive module
S3 driver for Factory drive module from NestJS framework

## Install dependencies
```bash
yarn add @the-software-compagny/nestjs_module_factorydrive @the-software-compagny/nestjs_module_factorydrive-s3
```

## Usage
```ts
@Module({
  //...
})
export class AppModule {
  public constructor(storage: FactorydriveService) {
    // If you want to add a new driver you can use the registerDriver method
    storage.registerDriver('s3', AwsS3Storage)
  }
}
```
