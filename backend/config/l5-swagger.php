<?php

return [
    'default' => 'default',

    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'Patrimonio Cultural Andino API',
            ],
            'routes' => [
                'api' => 'api/documentation',
            ],
            'paths' => [
                'use_absolute_path'      => env('L5_SWAGGER_USE_ABSOLUTE_PATH', true),
                'docs_json'              => 'api-docs.json',
                'docs_yaml'              => 'api-docs.yaml',
                'format_to_use_for_docs' => env('L5_FORMAT_TO_USE_FOR_DOCS', 'json'),
                'annotations'            => [base_path('app')],
                'base'                   => env('L5_SWAGGER_BASE_PATH', null),
                'docs'                   => storage_path('api-docs'),
                'views'                  => base_path('resources/views/vendor/l5-swagger'),
                'excludes'               => [],
                'swagger_ui_assets_path' => env('L5_SWAGGER_UI_ASSETS_PATH', 'vendor/swagger-api/swagger-ui/dist/'),
            ],
            'scanOptions' => [
                'default_processors_configuration' => [],
                'analyser'    => null,
                'analysis'    => null,
                'processors'  => [],
                'pattern'     => null,
                'exclude'     => [],
                'open_api_spec_version' => env('L5_SWAGGER_OPEN_API_SPEC_VERSION', \L5Swagger\Generator::OPEN_API_DEFAULT_SPEC_VERSION),
            ],
            'securityDefinitions' => [
                'securitySchemes' => [
                    'bearerAuth' => [
                        'type'         => 'http',
                        'scheme'       => 'bearer',
                        'bearerFormat' => 'JWT',
                        'description'  => 'Ingresa tu JWT. Ejemplo: Bearer eyJhbG...',
                    ],
                ],
                'security' => [
                    ['bearerAuth' => []],
                ],
            ],
            'generate_always'    => env('L5_SWAGGER_GENERATE_ALWAYS', false),
            'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', false),
            'proxy'              => false,
            'additional_config_url' => null,
            'operations_sort'    => env('L5_SWAGGER_OPERATIONS_SORT', null),
            'validator_url'      => null,
            'ui' => [
                'display' => [
                    'doc_expansion'   => env('L5_SWAGGER_UI_DOC_EXPANSION', 'none'),
                    'filter'          => env('L5_SWAGGER_UI_FILTERS', true),
                    'show_extensions' => env('L5_SWAGGER_UI_SHOW_EXTENSIONS', false),
                    'show_common_extensions' => env('L5_SWAGGER_UI_SHOW_COMMON_EXTENSIONS', false),
                ],
                'authorization' => [
                    'persist_authorization' => env('L5_SWAGGER_UI_PERSIST_AUTHORIZATION', true),
                    'oauth2RedirectUrl'     => env('L5_SWAGGER_UI_OAUTH2_REDIRECT_URL', '/api/documentation/oauth2-callback'),
                    'initOAuth'             => ['usePkceWithAuthorizationCodeGrant' => false],
                ],
            ],
        ],
    ],

    'defaults' => [
        'routes' => [
            'docs'      => 'docs',
            'oauth2_callback' => 'api/oauth2-callback',
            'middleware' => ['api' => [], 'asset' => [], 'docs' => [], 'oauth2_callback' => []],
            'group_options' => [],
        ],
        'paths' => [
            'docs'   => storage_path('api-docs'),
            'views'  => base_path('resources/views/vendor/l5-swagger'),
            'base'   => env('L5_SWAGGER_BASE_PATH', null),
            'swagger_ui_assets_path' => env('L5_SWAGGER_UI_ASSETS_PATH', 'vendor/swagger-api/swagger-ui/dist/'),
            'excludes' => [],
        ],
        'scanOptions' => [
            'default_processors_configuration' => [],
            'analyser' => null, 'analysis' => null, 'processors' => [],
            'pattern' => null, 'exclude' => [],
            'open_api_spec_version' => env('L5_SWAGGER_OPEN_API_SPEC_VERSION', \L5Swagger\Generator::OPEN_API_DEFAULT_SPEC_VERSION),
        ],
        'securityDefinitions' => [
            'securitySchemes' => [
                'bearerAuth' => ['type' => 'http', 'scheme' => 'bearer', 'bearerFormat' => 'JWT'],
            ],
            'security' => [],
        ],
        'generate_always'    => env('L5_SWAGGER_GENERATE_ALWAYS', false),
        'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', false),
        'proxy'              => false,
        'additional_config_url' => null,
        'operations_sort'    => env('L5_SWAGGER_OPERATIONS_SORT', null),
        'validator_url'      => null,
        'ui' => [
            'display' => ['doc_expansion' => 'none', 'filter' => true, 'show_extensions' => false, 'show_common_extensions' => false],
            'authorization' => [
                'persist_authorization' => true,
                'oauth2RedirectUrl'     => '/api/documentation/oauth2-callback',
                'initOAuth'             => ['usePkceWithAuthorizationCodeGrant' => false],
            ],
        ],
    ],
];
