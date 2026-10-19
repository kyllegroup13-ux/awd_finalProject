<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>M3 Dry Goods - Register</title>

    @vite(['resources/css/app.css'])
</head>

<body class="min-h-screen bg-gray-100 flex items-center justify-center">


    <div class="w-full max-w-5xl bg-white rounded-3xl shadow-lg p-12">


        <!-- Logo -->
        <div class="text-center">

            <div class="mx-auto w-20 h-20 bg-gray-200 flex items-center justify-center">
                <span class="text-3xl font-bold text-blue-700">
                    M3
                </span>
            </div>


            <h1 class="mt-4 text-4xl font-bold text-black">
                M3 Dry Goods
            </h1>


            <p class="text-lg text-gray-600">
                Inventory and Sales Management System
            </p>

        </div>



        <!-- Title -->

        <h2 class="text-center text-3xl font-bold mt-12 mb-10">
            Register
        </h2>



        <form method="POST" action="{{ route('register') }}">

            @csrf



            <!-- Email -->

            <div class="mb-6">

                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                    <span class="text-red-500">*</span>
                </label>


                <div class="flex items-center border rounded-xl px-4 py-3">

                    <span class="text-gray-400 mr-3">
                        ✉
                    </span>


                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@example.com"
                        class="w-full outline-none">

                </div>

            </div>





            <!-- Password Row -->

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">


                <div>

                    <label class="block text-sm font-semibold mb-2">
                        Password
                        <span class="text-red-500">*</span>
                    </label>


                    <div class="border rounded-xl px-4 py-3 flex">

                        <span class="mr-3">
                            🔒
                        </span>

                        <input
                            type="password"
                            name="password"
                            required
                            placeholder="Create a password"
                            class="w-full outline-none" />

                    </div>

                </div>




                <div>

                    <label class="block text-sm font-semibold mb-2">
                        Confirm Password
                        <span class="text-red-500">*</span>
                    </label>


                    <div class="border rounded-xl px-4 py-3 flex">

                        <span class="mr-3">
                            🔒
                        </span>

                        <input
                            type="password"
                            name="password_confirmation"
                            required
                            placeholder="Confirm your password"
                            class="w-full outline-none" />

                    </div>


                </div>


            </div>




            <!-- Password Requirement -->

            <div class="mt-4 text-sm text-gray-500">

                <span class="text-green-500">
                    ●
                </span>
                At least 8 characters

                <span class="mx-3">
                    •
                </span>

                Include a number

                <span class="mx-3">
                    •
                </span>

                Include a letter

            </div>




            <!-- Personal Information -->

            <h3 class="text-xl font-bold mt-10 mb-5">
                Personal Information
            </h3>



            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">


                <!-- Name -->

                <div>

                    <label class="block text-sm font-semibold mb-2">
                        Full Name
                        <span class="text-red-500">*</span>
                    </label>


                    <div class="border rounded-xl px-4 py-3 flex">

                        <span class="mr-3 text-gray-400">
                            👤
                        </span>


                        <input
                            type="text"
                            name="name"
                            required
                            placeholder="e.g. Juan Dela Cruz"
                            class="w-full outline-none" />


                    </div>

                </div>





                <!-- Role -->

                <div>

                    <label class="block text-sm font-semibold mb-2">
                        Role
                        <span class="text-red-500">*</span>
                    </label>


                    <select
                        name="role"
                        class="w-full border rounded-xl px-4 py-3 outline-none">


                        <option value="cashier">
                            Cashier
                        </option>


                        <option value="owner">
                            Owner
                        </option>


                    </select>


                </div>


            </div>





            <!-- Submit -->


            <button
                type="submit"
                class="mt-14 w-full bg-blue-950 hover:bg-blue-900 text-white py-4 rounded-xl font-semibold text-lg">


                Create Account
                <span class="ml-2">
                    →
                </span>


            </button>




            <!-- Login -->

            <p class="text-center mt-6 text-gray-500">

                Already have an account?

                <a href="{{ route('login') }}"
                    class="font-semibold text-gray-900">

                    Log in

                </a>

            </p>


        </form>


    </div>



</body>

</html>