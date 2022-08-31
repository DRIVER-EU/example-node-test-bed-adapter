import {
  CreateTopicRequest,
  Logger,
  LogLevel,
  TestBedAdapter,
} from 'node-test-bed-adapter';

const log = Logger.instance;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const silentProducer = () => {
  const id = 'tno-bootstrapper';

  const initialize = async () => {
    const waitFor = process.env.SLEEP || 10000;
    console.log(`Waiting for ${+waitFor / 1000}s before uploading schemas.`);
    await sleep(+waitFor);

    const adapter = new TestBedAdapter({
      kafkaHost: process.env.KAFKA_HOST || 'localhost:3501',
      schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
      clientId: id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      autoRegisterSchemas: true,
      autoRegisterDefaultSchemas: false,
      wrapUnions: 'auto',
      schemaFolder: process.env.SCHEMA_FOLDER || `${process.cwd()}/src/schemas`,
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Warn,
      },
    });

    adapter.on('error', (e) => console.error(e));
    adapter.on('ready', async () => {
      // Split the partition specification field
      const partitionSpecification =
        process.env.PARTITION_SPECIFICATION?.split(',') || [];

      // Create a record of <topic, partitions>
      let topicWithPartition = {} as Record<string, number>;
      partitionSpecification.forEach((item: string) => {
        const topic_with_partition = item.split(':');
        topicWithPartition[topic_with_partition[0] as string] = Number(
          topic_with_partition[1]
        ) as number;
      });

      let schemas = adapter.uploadedSchemas;
      const schemasToSend = schemas.map((topic: string) => {
        // If the topic is in the specified list, use that no. of partitions
        if (topic in topicWithPartition) {
          return {
            topic: topic,
            partitions: topicWithPartition[topic]
              ? topicWithPartition[topic]
              : process.env.DEFAULT_PARTITIONS || 1,
            replicationFactor: 1,
          };
        }
        // else use the default partition field
        return {
          topic: topic,
          partitions: process.env.DEFAULT_PARTITIONS || 1,
          replicationFactor: 1,
        };
      }) as Array<CreateTopicRequest>;
      try {
        const createdTopics = await adapter.createTopics(schemasToSend);
        if (createdTopics.length === 0) {
          // Crash if the topics were not correctly created. This will trigger a restart which should resolve the issue.
          console.log('0 topics created, restarting');
          process.exit(1);
        }
        log.info(
          `Created the following topics:\n${createdTopics
            .sort()
            .map((t) => `- ${t}`)
            .join('\n')}\n`
        );
      } catch (error) {
        console.log(error);
      }
      log.info(`Exiting ${id}.`);
      process.exit(0);
    });
    adapter.connect();
  };

  initialize();
};

silentProducer();
