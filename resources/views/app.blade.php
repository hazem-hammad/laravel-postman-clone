<!DOCTYPE html>
<html lang="en" style="--pc-primary: {{ $theme['primary_color'] }}; --pc-primary-text: {{ $theme['primary_text'] }};">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $theme['app_name'] }}</title>
    @if($theme['favicon_url'])<link rel="icon" href="{{ $theme['favicon_url'] }}">@endif
    @foreach($manifest['css'] as $css)
        <link rel="stylesheet" href="/{{ $route_prefix }}/dist/{{ $css }}">
    @endforeach
</head>
<body>
    <div id="app">
        @if(! $manifest['js'])
            <div style="padding:2rem;font-family:system-ui;color:#666">
                SPA bundle not built. Run <code>npm run build</code> in <code>resources/spa/</code>.
            </div>
        @endif
    </div>
    <script>
        window.__POSTMAN_CLONE__ = @json([
            'theme' => $theme,
            'route_prefix' => $route_prefix,
        ]);
    </script>
    @if($manifest['js'])
        <script type="module" src="/{{ $route_prefix }}/dist/{{ $manifest['js'] }}"></script>
    @endif
</body>
</html>
