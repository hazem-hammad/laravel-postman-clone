<!DOCTYPE html>
<html lang="en" style="--pc-primary: {{ $theme['primary_color'] }}; --pc-primary-text: {{ $theme['primary_text'] }};">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $theme['app_name'] }}</title>
    @if($theme['favicon_url'])<link rel="icon" href="{{ $theme['favicon_url'] }}">@endif
</head>
<body>
    <div id="app">SPA bundle not yet built. See Plan 2.</div>
    <script>
        window.__POSTMAN_CLONE__ = @json([
            'theme' => $theme,
            'route_prefix' => $route_prefix,
        ]);
    </script>
</body>
</html>
