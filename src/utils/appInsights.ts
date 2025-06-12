import * as appInsights from 'applicationinsights';

interface TelemetryData {
  [key: string]: any;
}

class ApplicationInsights {
  private client: appInsights.TelemetryClient | null = null;
  private isInitialized = false;

  initialize() {
    const instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || 
                              process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    
    if (!instrumentationKey) {
      console.warn('Application Insights not configured - telemetry disabled');
      return;
    }

    try {
      // Configure Application Insights
      appInsights.setup(instrumentationKey)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

      // Set cloud role name for better service map visualization
      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'trello-mcp-server';
      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRoleInstance] = process.env.WEBSITE_INSTANCE_ID || 'local';

      appInsights.start();
      this.client = appInsights.defaultClient;
      this.isInitialized = true;
      
      console.log('✅ Application Insights initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Application Insights:', error);
    }
  }

  trackEvent(name: string, properties?: TelemetryData, measurements?: TelemetryData) {
    if (!this.isInitialized || !this.client) return;
    
    const telemetryData: any = { name };
    if (properties) telemetryData.properties = properties;
    if (measurements) telemetryData.measurements = measurements;
    
    this.client.trackEvent(telemetryData);
  }

  trackRequest(name: string, url: string, duration: number, resultCode: string | number, success: boolean, properties?: TelemetryData) {
    if (!this.isInitialized || !this.client) return;
    
    const telemetryData: any = {
      name,
      url,
      duration,
      resultCode: resultCode.toString(),
      success
    };
    if (properties) telemetryData.properties = properties;
    
    this.client.trackRequest(telemetryData);
  }

  trackDependency(dependencyTypeName: string, name: string, data: string, duration: number, success: boolean, resultCode?: string, properties?: TelemetryData) {
    if (!this.isInitialized || !this.client) return;
    
    const telemetryData: any = {
      dependencyTypeName,
      name,
      data,
      duration,
      success,
      resultCode: resultCode || (success ? '200' : '500')
    };
    if (properties) telemetryData.properties = properties;
    
    this.client.trackDependency(telemetryData);
  }

  trackException(exception: Error, properties?: TelemetryData) {
    if (!this.isInitialized || !this.client) return;
    
    const telemetryData: any = { exception };
    if (properties) telemetryData.properties = properties;
    
    this.client.trackException(telemetryData);
  }

  trackMetric(name: string, value: number, properties?: TelemetryData) {
    if (!this.isInitialized || !this.client) return;
    
    const telemetryData: any = { name, value };
    if (properties) telemetryData.properties = properties;
    
    this.client.trackMetric(telemetryData);
  }

  trackTrace(message: string, severity?: appInsights.Contracts.SeverityLevel, properties?: TelemetryData) {
    if (!this.isInitialized || !this.client) return;
    
    const telemetryData: any = {
      message,
      severity: severity || appInsights.Contracts.SeverityLevel.Information
    };
    if (properties) telemetryData.properties = properties;
    
    this.client.trackTrace(telemetryData);
  }

  flush() {
    if (!this.isInitialized || !this.client) return;
    this.client.flush();
  }
}

export const insights = new ApplicationInsights();
export type { TelemetryData };