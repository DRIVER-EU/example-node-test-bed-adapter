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
      clientId: process.env.CLIENT_ID || id,
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

      const days7 = 7 * 24 * 3600000;
      const topicWithPartition = partitionSpecification.reduce((acc, item) => {
        const [topic, partitions = 1, retention = days7] = item.split(':');
        acc[topic] = [
          isNaN(+partitions) ? 1 : +partitions,
          isNaN(+retention) ? days7 : +retention,
        ];
        return acc;
      }, {} as Record<string, [partition: number, retention: number]>);

      const replicationFactor = 1;
      const partitions = process.env.DEFAULT_PARTITIONS || 1;
      const schemasToSend = adapter.uploadedSchemas.map((topic: string) =>
        topic in topicWithPartition
          ? {
              topic,
              partitions: topicWithPartition[topic][0],
              replicationFactor,
              configEntries: [
                {
                  name: 'retention.ms',
                  value: `${topicWithPartition[topic][1]}`,
                },
              ],
            }
          : {
              topic,
              partitions,
              replicationFactor,
            }
      ) as Array<CreateTopicRequest>;
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
