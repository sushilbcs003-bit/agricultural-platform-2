// OpenTelemetry tracing for React frontend
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { trace } from '@opentelemetry/api';

// Initialize OpenTelemetry
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'agricultural-frontend',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

const provider = new WebTracerProvider({
  resource,
});

// Configure OTLP exporter for Jaeger
const otlpExporter = new OTLPTraceExporter({
  url: process.env.REACT_APP_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {},
});

provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));

// Register instrumentations
registerInstrumentations({
  instrumentations: [
    new DocumentLoadInstrumentation(),
    new UserInteractionInstrumentation(),
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /http:\/\/localhost:3001/,
        /http:\/\/localhost:3002/,
      ],
    }),
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /http:\/\/localhost:3001/,
        /http:\/\/localhost:3002/,
      ],
    }),
  ],
});

// Register the provider
provider.register({
  contextManager: new ZoneContextManager(),
});

// Export tracer
export const tracer = trace.getTracer('agricultural-frontend');

// Helper function to create a span
export function createSpan(name, fn) {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({
        code: 2, // ERROR
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// Helper to add attributes to current span
export function addSpanAttribute(key, value) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}

// Helper to add event to current span
export function addSpanEvent(name, attributes) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

console.log('✅ OpenTelemetry tracing initialized for frontend');

export default provider;
