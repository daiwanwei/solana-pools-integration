# Solana Pools Integration

## How to Test

### 1. Set Up Test Environment

1. **Install Dependencies**: Ensure you have all the necessary dependencies installed. You can install them using `yarn`:

   ```sh
   yarn install
   ```

### 2. Build and Deploy the Program

1. **Build the Program**: Use the Anchor CLI to build the program:

   ```sh
   anchor build
   ```

2. **Deploy the Program**: Use the Anchor CLI to deploy the program to the local Solana cluster:
   ```sh
   anchor deploy
   ```

### 3. Run the Test Script

1. **Run Tests**: Use the test script defined in `Anchor.toml` to run the tests:
   ```sh
   anchor test
   ```

This will execute all the test files located in the `tests` directory.

## Additional Information

- **Formatting**: The project uses `treefmt` for formatting. You can format the code using:
  ```sh
  nix fmt
  ```
