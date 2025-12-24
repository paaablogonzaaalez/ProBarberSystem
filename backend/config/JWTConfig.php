<?php
$jwt_secret = getenv('JWT_SECRET_KEY') ?: 'fallback_key_solo_desarrollo';
define("JWT_SECRET_KEY", $jwt_secret);