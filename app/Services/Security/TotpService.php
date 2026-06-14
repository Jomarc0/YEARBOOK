<?php

declare(strict_types=1);

namespace App\Services\Security;

use Illuminate\Support\Str;

class TotpService
{
    private const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function generateSecret(int $length = 20): string
    {
        $bytes = random_bytes($length);
        $bits = '';

        foreach (str_split($bytes) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $secret = '';
        foreach (str_split($bits, 5) as $chunk) {
            $secret .= self::BASE32_ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

        return $secret;
    }

    public function provisioningUri(string $issuer, string $account, string $secret): string
    {
        $label = rawurlencode($issuer . ':' . $account);
        $query = http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => 6,
            'period' => 30,
        ], '', '&', PHP_QUERY_RFC3986);

        return "otpauth://totp/{$label}?{$query}";
    }

    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $code = preg_replace('/\D+/', '', $code) ?? '';
        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $timeSlice = intdiv(time(), 30);
        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals($this->at($secret, $timeSlice + $i), $code)) {
                return true;
            }
        }

        return false;
    }

    private function at(string $secret, int $timeSlice): string
    {
        $key = $this->base32Decode($secret);
        $time = pack('N*', 0) . pack('N*', $timeSlice);
        $hash = hash_hmac('sha1', $time, $key, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $binary = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        return str_pad((string) ($binary % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $secret): string
    {
        $secret = strtoupper(Str::of($secret)->replaceMatches('/[^A-Z2-7]/', '')->toString());
        $bits = '';

        foreach (str_split($secret) as $char) {
            $value = strpos(self::BASE32_ALPHABET, $char);
            if ($value === false) {
                continue;
            }
            $bits .= str_pad(decbin($value), 5, '0', STR_PAD_LEFT);
        }

        $decoded = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $decoded .= chr(bindec($byte));
            }
        }

        return $decoded;
    }
}
