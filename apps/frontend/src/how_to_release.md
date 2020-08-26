# Releasing

I'm documenting this here so the bus factor on creaing new versions isn't one.
Obviously, before any of them make well sure that:

1. The code works as you expect
2. You've scrubbed it for obsceneties or private keys
3. You've incremented the version number in package.json
4. You've done `npm run lint`
5. You've done `npm run build`
6. You've committed, pushed, and merged everything you want.

Great! You'r ready to start publishing!

## Publishing to NPM

1. Run `npm publish`
2. You're done!

If this seems short, know that most of the work was done in the initial steps.

## Publishing on github

1. Go to https://github.com/mitre/heimdall-lite/releases
2. I'm pretty sure you edit the most recently drafted release, and then... ???
3. Ask Aaron about this one haha I haven't done it!

## Publishing elsewhere?

1. I don't think we do, yet.
