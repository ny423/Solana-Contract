use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, InitializeMint};  // Ensure anchor_spl is imported

declare_id!("ACmGwLqg5B8NmSp5bXFiKLpZPoEffEaKrhezwJvTxQrt");

#[program]
pub mod spl_token_example {
    use super::*;

    pub fn create_mint(ctx: Context<CreateMint>, decimals: u8) -> Result<()> {
        let cpi_accounts = InitializeMint {
            mint: ctx.accounts.mint.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::initialize_mint(cpi_ctx, decimals, ctx.accounts.authority.key, None)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(init, payer = authority, space = Mint::LEN)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
