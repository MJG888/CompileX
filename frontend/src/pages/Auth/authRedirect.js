export function getSafeAuthRedirect(search) {
    const params = new URLSearchParams(search);
    const redirect = params.get('redirect');
    const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/';

    if (params.get('ai') === '1' && safeRedirect === '/compiler') {
        return '/compiler?ai=1';
    }

    return safeRedirect;
}

export function withAuthSearch(path, search) {
    return search ? `${path}${search}` : path;
}
