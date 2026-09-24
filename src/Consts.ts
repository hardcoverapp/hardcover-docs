export const URLS = {
    APP: 'https://hardcover.app',
    API: 'https://api.hardcover.app',
    API_ACCOUNT_URL: 'https://hardcover.app/account/api',
    API_NEW_TOKEN_URL: 'https://hardcover.app/account/api/keys/new',
    DEVELOPER_APPS_URL: 'https://hardcover.app/account/developer-apps',
    NEW_DEVELOPER_APP_URL: 'https://hardcover.app/account/developer-apps/new',
    AUTHORIZED_APPS_URL: 'https://hardcover.app/account/api/authorized-apps',
    API_CAPABILITIES_URL: 'https://api.hardcover.app/capabilities.json',
    DOCS: 'https://docs.hardcover.app',
    POLICIES: 'https://hardcover.app/pages/policies',
    DMCA: 'https://hardcover.app/pages/dmca',

    OAUTH_AUTHORIZE_URL: 'https://hardcover.app/oauth2/authorize',
    OAUTH_TOKEN_URL: 'https://api.hardcover.app/oauth2/token',
    OAUTH_REVOKE_URL: 'https://api.hardcover.app/oauth2/revoke',
    OAUTH_INTROSPECT_URL: 'https://api.hardcover.app/oauth2/introspect',
    OAUTH_DEVICE_URL: 'https://api.hardcover.app/oauth2/device',
    OAUTH_DISCOVERY_URL: 'https://api.hardcover.app/.well-known/oauth-authorization-server',
    DEVICE_LINK_URL: 'https://hardcover.app/link',

    GRAPHQL_URL: 'https://api.hardcover.app/v1/graphql',

    GITHUB: 'https://github.com/hardcoverapp/hardcover-docs/',
    GITHUB_EDIT: 'https://github.com/hardcoverapp/hardcover-docs/edit/main/',
    GITHUB_DEV: 'https://github.dev/hardcoverapp/hardcover-docs/blob/main/',

    ISSUES: 'https://github.com/hardcoverapp/hardcover-docs/issues',
    CREATE_ISSUE: 'https://github.com/hardcoverapp/hardcover-docs/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=',
    SUGGEST_FEATURE: 'https://github.com/hardcoverapp/hardcover-docs/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=',

    DISCORD: 'https://discord.gg/edGpYN8ym8',
    API_DISCORD: 'https://discord.com/channels/835558721115389962/1278040045324075050',
    BUGS_DISCORD: 'https://discord.com/channels/835558721115389962/1105920773257953310',
    LIBRARIAN_DISCORD: 'https://discord.com/channels/835558721115389962/1105918193022812282',
    
    LIBRARIAN_APPLICATION: 'https://hardcover.app/librarians/apply',
    MEMBERSHIP: 'https://hardcover.app/account/membership',
    LINK_ROLES: 'https://hardcover.app/pages/how-to-link-hardcover-roles-with-discord',

    APP_STORE: 'https://apps.apple.com/us/app/hardcover-app/id1663379893',
    PLAY_STORE: 'https://play.google.com/store/apps/details?id=hardcover.app',

    INSTAGRAM: 'https://instagram.com/hardcover.app',
    MASTODON: 'https://mastodon.hardcover.app/@hardcover',
};

export const defaultPreferences: {
    theme: 'auto' | 'dark' | 'light';
    editMode: 'basic' | 'developer';
    graphQLResults: 'table' | 'json' | 'chart';
} = {
    theme: 'auto',
    editMode: 'basic',
    graphQLResults: 'table',
}

export const EMAILS = {
    SUPPORT: 'jules@hardcover.app'
}
