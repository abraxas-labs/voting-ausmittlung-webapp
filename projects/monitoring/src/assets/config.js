(function (window) {
    window["config"] = window["config"] || {};
    window["config"].VOTING_API_BASE = "${VOTING_API_BASE}";
    window["config"].API_BASE = "${API_BASE}";
    window["config"].ENV = "${ENV}";
    window["config"].ISSUER = "${ISSUER}";
    window["config"].SC_SERVICE_NAME_ERFASSUNG = "${SC_SERVICE_NAME_ERFASSUNG}";
    window["config"].SC_SERVICE_NAME_MONITORING = "${SC_SERVICE_NAME_MONITORING}";
    window["config"].SC_SERVICE_NAME_IDENTITY = "${SC_SERVICE_NAME_IDENTITY}";
    window["config"].SC_SERVICE_NAME_PERMISSION = "${SC_SERVICE_NAME_PERMISSION}";
    window["config"].VOTING_BASIS_WEBAPP = "${VOTING_BASIS_WEBAPP}";
    window["config"].RUNTIME_CONFIG_POLLING_INTERVAL_SECONDS = "${RUNTIME_CONFIG_POLLING_INTERVAL_SECONDS}"
    window["config"].RUNTIME_CONFIG_POLLING_ENDPOINT = "${RUNTIME_CONFIG_POLLING_ENDPOINT}"
    window["config"].EVENT_LOG_WATCH_DELAY_MS = "${EVENT_LOG_WATCH_DELAY_MS}"
})(this);
