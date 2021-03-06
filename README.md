# example-node-test-bed-adapter

Example project for the node-test-bed-adapter.

The example assumes that the DRIVER-EU Apache Kafka-based test-bed is running. If not, see the [test-bed installation instructions](https://github.com/DRIVER-EU/test-bed) for installing a local version of the test-bed.

The example performs the following actions:

- Installing the required `npm` packages, including the `node-test-bed-adapter`.
- `producer.ts`: Upload the AVRO schemas from the `src/schemas` folder to the [Kafka schema registry](http://localhost:3601) (note that this is not required during production, when the test-bed admin tool takes over this role, so use it only once after starting the Docker-based test-bed to register all schemas). You can turn it off by settings `autoRegisterSchemas: false`.
- `producer.ts`: Send 4 CAP messages to the test-bed. You can inspect them by visiting the [Kafka topics UI](http://localhost:3600).
- `silent-producer.ts`: Uploads schema's from the `SCHEMA_FOLDER` environment variable (or from the docker image), and creates topics on the test-bed without sending data to those topics. You can inspect them by visiting the [Kafka topics UI](http://localhost:3600). There is also a docker image you can use, `drivereu/silent-producer:v2.0.0`.
- `consumer.ts`: Receive CAP messages and log them to screen.

## Installation

```bash
npm i
npm run build
```

## Docker

```bash
npm run docker:build:silentproducer
```

This will create a docker local image with the name 'silent-producer'. See the `docker-compose.yml` for an example service configuration to add in your test-bed composition.

To publish the local docker image to drivereu dockerhub:

```bash
docker login --username=<<GIT USERNAME e.g. kluiverjh>>
npm run docker:build:silentproducer
npm run docker:tag:silentproducer
npm run docker:publish:silentproducer
```

## Usage

You can start them in two terminals, or one after the other.

```bash
npm run producer # To produce some CAP messages. Use CTRL-C to stop it.
npm run consumer # To consume these CAP messages. Use CTRL-C to stop it.
npm run silent-producer # To create some topics. Use CTRL-C to stop it.
```

## Develop

```bash
npm start
```



## WARNING

The .NET kafka adapter publish the kafka schema's (found no way to disable this)! When the schema matches the already published schema nothing happens, but when there are changes the schema version is update in the registry (even if the changes are in the documentation)!