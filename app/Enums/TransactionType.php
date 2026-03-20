<?php

namespace App\Enums;

enum TransactionType: string
{
    case StockIn          = 'stock_in';
    case StockOut         = 'stock_out';
    case AdjustmentIn     = 'adjustment_in';
    case AdjustmentOut    = 'adjustment_out';
    case TransferIn       = 'transfer_in';
    case TransferOut      = 'transfer_out';
    case ReturnIn         = 'return_in';
    case ReturnOut        = 'return_out';
    case OpeningStock     = 'opening_stock';
    case DamageWriteOff   = 'damage_write_off';
    case ExpiredWriteOff  = 'expired_write_off';

    public function label(): string
    {
        return match($this) {
            self::StockIn         => 'Stock In',
            self::StockOut        => 'Stock Out',
            self::AdjustmentIn    => 'Adjustment (In)',
            self::AdjustmentOut   => 'Adjustment (Out)',
            self::TransferIn      => 'Transfer In',
            self::TransferOut     => 'Transfer Out',
            self::ReturnIn        => 'Return In',
            self::ReturnOut       => 'Return Out',
            self::OpeningStock    => 'Opening Stock',
            self::DamageWriteOff  => 'Damage Write-Off',
            self::ExpiredWriteOff => 'Expiry Write-Off',
        };
    }

    public function isInbound(): bool
    {
        return in_array($this, [
            self::StockIn, self::AdjustmentIn, self::TransferIn,
            self::ReturnIn, self::OpeningStock,
        ]);
    }

    public function isOutbound(): bool
    {
        return !$this->isInbound();
    }
}
