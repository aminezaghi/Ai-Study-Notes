<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email_verification_code', 6)->nullable()->after('email');
            $table->timestamp('email_verification_code_expires_at')->nullable()->after('email_verification_code');
            $table->timestamp('email_verified_at')->nullable()->after('email_verification_code_expires_at');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_verification_code',
                'email_verification_code_expires_at',
                'email_verified_at'
            ]);
        });
    }
};