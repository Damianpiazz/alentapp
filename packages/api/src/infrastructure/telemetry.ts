import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import { metrics, ObservableResult } from '@opentelemetry/api';

const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
});

const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-http': {},
        }),
        new FastifyInstrumentation(),
    ],
});

sdk.start();

const meter = metrics.getMeter('alentapp-api');

export const requestCounter = meter.createCounter('http.requests.total', {
    description: 'Total de requests HTTP',
});
export const errorCounter = meter.createCounter('http.requests.errors', {
    description: 'Total de errores HTTP',
});
export const requestDuration = meter.createHistogram('http.request.duration', {
    description: 'Duración de requests',
    unit: 'ms',
});

export const activeRequestsCounter = meter.createUpDownCounter(
    'http.requests.active',
    {
        description: 'Requests siendo procesadas en este momento',
    },
);

const memoryGauge = meter.createObservableGauge('process.memory.usage', {
    description: 'Memoria heap utilizada por el proceso Node.js',
    unit: 'bytes',
});
memoryGauge.addCallback((result: ObservableResult) => {
    result.observe(process.memoryUsage().heapUsed);
});

export { sdk, prometheusExporter };
