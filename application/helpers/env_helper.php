<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Baca variabel rahasia (kredensial SMTP, token gateway, dll) dari file
 * .env di root project, format KEY=VALUE per baris (baris kosong & yang
 * diawali # diabaikan). Environment variable asli (getenv()) selalu
 * menang duluan kalau ada -- .env cuma fallback buat development lokal.
 *
 * .env TIDAK di-commit ke git (lihat .gitignore). Salin dari .env.example
 * lalu isi nilai aslinya di situ, JANGAN di .env.example.
 */
function env($key, $default = null)
{
    static $parsed;

    if ($parsed === null) {
        $parsed = [];
        $path = FCPATH . '.env';

        if (is_file($path)) {
            foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#' || strpos($line, '=') === FALSE) {
                    continue;
                }

                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v);

                // Buang tanda kutip pembungkus kalau nilainya dikutip, mis. FOO="bar baz"
                if (strlen($v) >= 2 && (($v[0] === '"' && substr($v, -1) === '"') || ($v[0] === "'" && substr($v, -1) === "'"))) {
                    $v = substr($v, 1, -1);
                }

                $parsed[$k] = $v;
            }
        }
    }

    $env_value = getenv($key);
    if ($env_value !== FALSE) {
        return $env_value;
    }

    return $parsed[$key] ?? $default;
}
