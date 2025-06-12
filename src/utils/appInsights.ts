// Application Insights - No-op implementation for basic usage
interface TelemetryData {
  [key: string]: any;
}

class ApplicationInsights {
  private isEnabled = false;

  initialize() {
    // Check if Application Insights is configured
    const instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || 
                              process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    
    if (instrumentationKey) {
      try {
        // Try to load Application Insights if available
        const appInsights = require('applicationinsights');
        appInsights.setup(instrumentationKey).start();
        this.isEnabled = true;
        console.log('✅ Application Insights initialized');
      } catch (error) {
        console.warn('Application Insights not available, using no-op implementation');
      }
    } else {
      console.warn('Application Insights not configured - telemetry disabled');
    }
  }

  trackEvent(_name: string, _properties?: TelemetryData, _measurements?: TelemetryData) {
    if (!this.isEnabled) return;
    // No-op implementation - could be extended with actual tracking
  }

  trackRequest(_name: string, _url: string, _duration: number, _resultCode: string | number, _success: boolean, _properties?: TelemetryData) {
    if (!this.isEnabled) return;
    // No-op implementation
  }

  trackDependency(_dependencyTypeName: string, _name: string, _data: string, _duration: number, _success: boolean, _resultCode?: string, _properties?: TelemetryData) {
    if (!this.isEnabled) return;
    // No-op implementation
  }

  trackException(exception: Error, _properties?: TelemetryData) {
    if (!this.isEnabled) return;
    // No-op implementation - could log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Exception tracked:', exception.message);
    }
  }

  trackMetric(_name: string, _value: number, _properties?: TelemetryData) {
    if (!this.isEnabled) return;
    // No-op implementation
  }

  trackTrace(_message: string, _severity?: number, _properties?: TelemetryData) {
    if (!this.isEnabled) return;
    // No-op implementation
  }

  flush() {
    if (!this.isEnabled) return;
    // No-op implementation
  }
}

export const insights = new ApplicationInsights();
export type { TelemetryData };