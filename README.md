# example-node-test-bed-adapter

Example project for the node-test-bed-adapter.

The example assumes that the DRIVER-EU Apache Kafka-based test-bed is running. If not, see the [test-bed installation instructions](https://github.com/DRIVER-EU/test-bed) for installing a local version of the test-bed.

The example performs the following actions:

- Installing the required `npm` packages, including the `node-test-bed-adapter`.
- `producer.ts`: Upload the AVRO schemas from the `src/schemas` folder to the [Kafka schema registry](http://localhost:3601) (note that this is not required during production, when the test-bed admin tool takes over this role, so use it only once after starting the Docker-based test-bed to register all schemas). You can turn it off by settings `autoRegisterSchemas: false`.
- `producer.ts`: Send 4 CAP messages to the test-bed. You can inspect them by visiting the [Kafka topics UI](http://localhost:3600).
- `silent-producer.ts`: Uploads schema's from the `SCHEMA_FOLDER` environment variable (or from the docker image), and creates topics on the test-bed without sending data to those topics. You can inspect them by visiting the [Kafka topics UI](http://localhost:3600). There is also a docker image you can use, `drivereu/silent-producer:v2.0.0`.
- `consumer.ts`: Receives CAP messages and log them to screen.

## Installation

Assuming you have Node.js 16 or another recent version running, you should install the dependencies and build it:

```bash
npm i
npm run build
# npm start  # If you are developping/debugging
```

## Running

In the `.env` file, you need to specify the URL of the Kafka broker and the schema registry (see `.env.example`), or you can manually edit it in the configuration of the `consumer.ts` and `producer.ts` file. If you are using vscode, you can use the debugger to first launch the producer and next the consumer in order to test it.

Alternatively, you can run it manually using node (v16):

```bash
node --experimental-json-modules dist/producer.js
node dist/consumer.js
```

## Docker

```bash
npm run docker:build:silentproducer
```

| ENVIRONMENT VARIABLE    | Default value    | Example                                                    |
| ----------------------- | ---------------- | ---------------------------------------------------------- |
| CLIENT_ID               | tno-bootstrapper |                                                            |
| KAFKA_HOST              | localhost:3501   |                                                            |
| SCHEMA_REGISTRY         | localhost:3502   |                                                            |
| SCHEMA_FOLDER           | $PWD/src/schemas |                                                            |
| DEFAULT_PARTITIONS      | 1                |                                                            |
| PARTITION_SPECIFICATION | ''               | system_heartbeat:1:360000,topic:partitions:retention_in_ms |


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
