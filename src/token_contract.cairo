#[contract]
mod TelegramToken {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use zeroable::Zeroable;
    use integer::u256;
    use integer::u256_from_felt252;

    // Storage
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,
        total_supply: u256,
        balances: LegacyMap<ContractAddress, u256>,
        allowances: LegacyMap<(ContractAddress, ContractAddress), u256>,
        owner: ContractAddress,
    }

    // Events
    #[event]
    fn Transfer(from: ContractAddress, to: ContractAddress, value: u256) {}

    #[event]
    fn Approval(owner: ContractAddress, spender: ContractAddress, value: u256) {}

    // Constructor
    #[constructor]
    fn constructor(
        name_: felt252,
        symbol_: felt252,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        name::write(name_);
        symbol::write(symbol_);
        decimals::write(18_u8);
        owner::write(get_caller_address());
        _mint(recipient, initial_supply);
    }

    // View functions
    #[view]
    fn name() -> felt252 {
        name::read()
    }

    #[view]
    fn symbol() -> felt252 {
        symbol::read()
    }

    #[view]
    fn decimals() -> u8 {
        decimals::read()
    }

    #[view]
    fn total_supply() -> u256 {
        total_supply::read()
    }

    #[view]
    fn balance_of(account: ContractAddress) -> u256 {
        balances::read(account)
    }

    #[view]
    fn allowance(owner: ContractAddress, spender: ContractAddress) -> u256 {
        allowances::read((owner, spender))
    }

    // External functions
    #[external]
    fn transfer(recipient: ContractAddress, amount: u256) -> bool {
        let sender = get_caller_address();
        _transfer(sender, recipient, amount);
        true
    }

    #[external]
    fn transfer_from(
        sender: ContractAddress,
        recipient: ContractAddress,
        amount: u256
    ) -> bool {
        let caller = get_caller_address();
        _spend_allowance(sender, caller, amount);
        _transfer(sender, recipient, amount);
        true
    }

    #[external]
    fn approve(spender: ContractAddress, amount: u256) -> bool {
        let caller = get_caller_address();
        _approve(caller, spender, amount);
        true
    }

    #[external]
    fn mint(recipient: ContractAddress, amount: u256) {
        assert(get_caller_address() == owner::read(), 'Only owner can mint');
        _mint(recipient, amount);
    }

    // Internal functions
    fn _mint(recipient: ContractAddress, amount: u256) {
        assert(!recipient.is_zero(), 'ERC20: mint to zero address');
        total_supply::write(total_supply::read() + amount);
        balances::write(recipient, balances::read(recipient) + amount);
        Transfer(Zeroable::zero(), recipient, amount);
    }

    fn _transfer(sender: ContractAddress, recipient: ContractAddress, amount: u256) {
        assert(!sender.is_zero(), 'ERC20: transfer from zero');
        assert(!recipient.is_zero(), 'ERC20: transfer to zero');

        let sender_balance = balances::read(sender);
        assert(sender_balance >= amount, 'ERC20: insufficient balance');

        balances::write(sender, sender_balance - amount);
        balances::write(recipient, balances::read(recipient) + amount);
        Transfer(sender, recipient, amount);
    }

    fn _approve(owner: ContractAddress, spender: ContractAddress, amount: u256) {
        assert(!owner.is_zero(), 'ERC20: approve from zero');
        assert(!spender.is_zero(), 'ERC20: approve to zero');
        allowances::write((owner, spender), amount);
        Approval(owner, spender, amount);
    }

    fn _spend_allowance(owner: ContractAddress, spender: ContractAddress, amount: u256) {
        let current_allowance = allowances::read((owner, spender));
        if current_allowance != u256_from_felt252(-1) {
            assert(current_allowance >= amount, 'ERC20: insufficient allowance');
            _approve(owner, spender, current_allowance - amount);
        }
    }
}
