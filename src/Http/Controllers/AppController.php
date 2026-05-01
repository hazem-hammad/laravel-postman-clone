<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Routing\Controller;

class AppController extends Controller
{
    public function show(): Response
    {
        return response()->view('postman-clone::app', [
            'theme' => config('postman-clone.theme'),
            'route_prefix' => config('postman-clone.route.prefix'),
        ]);
    }
}
