<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Users ────────────────────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'System Administrator',
            'email'    => 'admin@ims.local',
            'password' => Hash::make('admin@123'),
            'role'     => 'admin',
            'is_active'=> true,
            'phone'    => '+254700000001',
        ]);

        $manager = User::create([
            'name'     => 'Store Manager',
            'email'    => 'manager@ims.local',
            'password' => Hash::make('manager@123'),
            'role'     => 'manager',
            'is_active'=> true,
            'phone'    => '+254700000002',
        ]);

        User::create([
            'name'     => 'Store Clerk',
            'email'    => 'clerk@ims.local',
            'password' => Hash::make('clerk@123'),
            'role'     => 'store_clerk',
            'is_active'=> true,
            'phone'    => '+254700000003',
        ]);

        // ─── Categories ───────────────────────────────────────────────────────
       /* $categories = collect([
            ['name' => 'Electronics',    'description' => 'Electronic devices and accessories'],
            ['name' => 'Stationery',     'description' => 'Office and school stationery'],
            ['name' => 'Cleaning Supplies','description'=> 'Cleaning and hygiene products'],
            ['name' => 'IT Equipment',   'description' => 'Computers, printers, and IT peripherals'],
            ['name' => 'Furniture',      'description' => 'Office furniture'],
        ])->map(fn ($c) => Category::create($c));

        // ─── Suppliers ────────────────────────────────────────────────────────
        $suppliers = collect([
            ['name' => 'Nairobi Tech Supplies', 'email' => 'orders@nairobtech.co.ke',
             'phone' => '+254711111111', 'contact_person' => 'James Mwangi', 'status' => 'active'],
            ['name' => 'Office World Kenya', 'email' => 'supply@officeworld.co.ke',
             'phone' => '+254722222222', 'contact_person' => 'Sarah Akinyi', 'status' => 'active'],
            ['name' => 'Clean Africa Ltd', 'email' => 'stock@cleanafrica.co.ke',
             'phone' => '+254733333333', 'contact_person' => 'Peter Ochieng', 'status' => 'active'],
        ])->map(fn ($s) => Supplier::create($s));

        // ─── Products ─────────────────────────────────────────────────────────
        $products = [
            ['name' => 'HP Laptop 15"',     'category_id' => $categories[0]->id, 'supplier_id' => $suppliers[0]->id,
             'unit_price' => 75000, 'selling_price' => 82000, 'reorder_level' => 3,
             'reorder_quantity' => 10, 'minimum_stock' => 2, 'maximum_stock' => 50,
             'unit_of_measure' => 'piece'],

            ['name' => 'A4 Printing Paper (Ream)', 'category_id' => $categories[1]->id, 'supplier_id' => $suppliers[1]->id,
             'unit_price' => 450, 'selling_price' => 550, 'reorder_level' => 20,
             'reorder_quantity' => 100, 'minimum_stock' => 10, 'maximum_stock' => 500,
             'unit_of_measure' => 'ream'],

            ['name' => 'Blue Ballpoint Pens (Box)', 'category_id' => $categories[1]->id, 'supplier_id' => $suppliers[1]->id,
             'unit_price' => 120, 'selling_price' => 180, 'reorder_level' => 10,
             'reorder_quantity' => 50, 'minimum_stock' => 5, 'maximum_stock' => 200,
             'unit_of_measure' => 'box'],

            ['name' => 'Hand Sanitizer 500ml', 'category_id' => $categories[2]->id, 'supplier_id' => $suppliers[2]->id,
             'unit_price' => 250, 'selling_price' => 350, 'reorder_level' => 15,
             'reorder_quantity' => 60, 'minimum_stock' => 10, 'maximum_stock' => 300,
             'unit_of_measure' => 'piece', 'track_expiry' => true],

            ['name' => 'USB Flash Drive 32GB', 'category_id' => $categories[3]->id, 'supplier_id' => $suppliers[0]->id,
             'unit_price' => 600, 'selling_price' => 900, 'reorder_level' => 10,
             'reorder_quantity' => 40, 'minimum_stock' => 5, 'maximum_stock' => 150,
             'unit_of_measure' => 'piece'],
        ];

        $openingStocks = [40, 350, 80, 60, 35];

        foreach ($products as $i => $productData) {
            $product = Product::create($productData);
            // Update the auto-created stock record with opening quantity
            $product->stock()->update(['quantity_on_hand' => $openingStocks[$i]]);
        }*/

        $this->command->info('✅ Database seeded successfully!');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',       'admin@ims.local',   'admin@123'],
                ['Manager',     'manager@ims.local', 'manager@123'],
                ['Store Clerk', 'clerk@ims.local',   'clerk@123'],
            ]
        );
    }
}
