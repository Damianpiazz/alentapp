import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { metrics, Meter } from '@opentelemetry/api';

// Configurar Prometheus Exporter
const prometheusExporter = new PrometheusExporter({
    port: 9464,
    endpoint: '/metrics',
});

// Crear SDK con auto-instrumentaciones
const sdk = new NodeSDK({
    metricReader: prometheusExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-http': {},
            //'@opentelemetry/instrumentation-fastify': {},
        }),
    ],
});

// Iniciar SDK
sdk.start();

const meter = metrics.getMeter('alentapp-api');

export function createREDMetrics(meter: Meter) {
    const requestCounter = meter.createCounter('http.requests.total', {
        description: 'Total de requests HTTP',
    });
    const errorCounter = meter.createCounter('http.requests.errors', {
        description: 'Total de errores HTTP',
    });
    const requestDuration = meter.createHistogram('http.request.duration', {
        description: 'Duración de requests',
        unit: 'ms',
    });
    const activeRequests = meter.createUpDownCounter('http.requests.active', {
        description: 'Requests siendo procesadas en este momento',
    });
    return { requestCounter, errorCounter, requestDuration, activeRequests };
}

meter
    .createObservableGauge('process.memory.usage', {
        description: 'Memoria heap utilizada por el proceso Node.js',
        unit: 'bytes',
    })
    .addCallback((result) => {
        result.observe(process.memoryUsage().heapUsed);
    });

export { sdk, meter, prometheusExporter };
