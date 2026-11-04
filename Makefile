help: 
	#########################################################################################
	#                                                                                       #                                             
	#                               @Startr/WEB-11ty Makefile                               #
	#                                                                                       #
	#  This is the default make command. It will show you all the available make commands	#
	#  If you haven't already we start by installing the development environment            #
	#                                                                                       #
	#  `make this_dev_env` once you have done that you can start using the other commands	#
	#  `make it_run` will build and run the project using `bun run start`                   #
	#  `make things_clean` will clean the project of all untracked files                    #
	#  `make feature <feature_name>` will start a new feature branch                        #
	#  `make feature_finish` will finish the current feature branch                         #
	#  `make minor_release` will start a new minor release                                  #
	#  `make patch_release` will start a new patch release                                  #
	#  `make major_release` will start a new major release                                  #
	#  `make release_finish` will finish the current release branch                         #	
	#  `make hotfix` will start a new hotfix branch                                         #
	#  `make hotfix_finish` will finish the current hotfix branch                           #
	#                                                                                       #
	#########################################################################################
	@LC_ALL=C $(MAKE) -pRrq -f $(firstword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/(^|\n)# Files(\n|$$)/,/(^|\n)# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | grep -E -v -e '^[^[:alnum:]]' -e '^$@$$'

it_run:
	bun run start


this_dev_env:
	# Install the development environment
	# This will install all the necessary dependencies for the project
	# This will also install the necessary git hooks
	# This will also install the necessary git flow
	# install brew if necessary
	/bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
	# install git if necessary
	brew install git
	# install git flow if necessary
	brew install git-flow
	# install pre-commit if necessary
	#brew install pre-commit
	# install pre-commit hooks
	#pre-commit install
	#NOTE we don't yet use pre-commit hooks
	# install bun if necessary
	brew install bun
	# Setup git flow
	$(MAKE) things_flow
	# install dev packages
	bun install --dev

things_flow:
	#
	# Setting up git flow
	# When prompted for the branch names, just hit enter to accept the defaults
	# When prompted for the version tag prefix, specify 'v' and hit enter
	#
	git flow init

feature:
	# Ingest a feature name and save it to a variable we can access in feature_finish:
	git flow feature start $1

feature_finish:
	# Ingest a feature name and save it to a variable we can access in feature_finish:
	git flow feature finish $$(git branch --show-current)

# Define the bump_version logic inline for each release type

minor_release:
	# Start a minor release with incremented minor version
	git flow release start v$$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1"."$$2+1".0"}')

patch_release:
	# Start a patch release with incremented patch version
	git flow release start v$$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1"."$$2"."$$3+1}')

major_release:
	# Start a major release with incremented major version
	git flow release start v$$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1+1".0.0"}')

hotfix:
	# Start a hotfix with incremented patch version
	git flow hotfix start v$$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1"."$$2"."$$3+1}')

release_finish:
	git flow release finish "$$(git branch --show-current | sed 's/release\///')" && git push origin develop && git push origin master && git push --tags && git checkout develop

hotfix_finish:
	git flow hotfix finish "$$(git branch --show-current | sed 's/hotfix\///')" && git push origin develop && git push origin master && git push --tags && git checkout develop

things_clean:
	git clean --exclude=!.env -Xdf
