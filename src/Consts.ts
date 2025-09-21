export const URLS = {
    APP: 'https://hardcover.app',
    API: 'https://api.hardcover.app',
    API_ACCOUNT_URL: 'https://hardcover.app/account/api',
    DOCS: 'https://docs.hardcover.app',

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
    graphQLResults: 'table' | 'json';
} = {
    theme: 'auto',
    editMode: 'basic',
    graphQLResults: 'table',
}
