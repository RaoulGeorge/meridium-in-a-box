import ApplicationContext = require('application/application-context');

export function documentStorage(): { name: string, description: string } {
    const session = ApplicationContext.session;
    const server = session.apiServer.toUpperCase();
    const datasource = session.datasourceId.toUpperCase();
    const userId = session.userId.toUpperCase();
    const name = 'Meridium APM(' + server + ', ' + datasource + ', ' + userId + ')';
    return { name: name, description: name };
}
