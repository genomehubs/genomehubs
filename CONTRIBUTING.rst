============
Contributing
============

Bug reports
===========

When `reporting a bug <https://github.com/genomehubs/genomehubs/issues>`_ please include:

    * Your operating system name and version.
    * Any details about your local setup that might be helpful in troubleshooting.
    * Detailed steps to reproduce the bug.

Documentation improvements
==========================

Contributions to the official genomehubs docs and internal docstrings are always welcome.

Feature requests and feedback
=============================

The best way to send feedback is to file an issue at https://github.com/genomehubs/genomehubs/issues.

If you are proposing a feature:

* Explain in detail how it would work.
* Keep the scope as narrow as possible, to make it easier to implement.
* Remember that code contributions are welcome

Development
===========

To install the development version of `genomehubs`:

1. Clone the `genomehubs` repository::

    git clone https://github.com/genomehubs/genomehubs

2. Install the dependencies using pip::

    cd genomehubs
    pip install -r requirements.txt

3. Build and install the `genomehubs` package::

    python3 setup.py sdist bdist_wheel \
    && echo y | pip uninstall genomehubs \
    && pip install dist/genomehubs-2.0.0-py3-none-any.whl

To set up `genomehubs` for local development:

1. Fork `genomehubs <https://github.com/genomehubs/genomehubs>` - (look for the "Fork" button).
2. Clone your fork locally::

    git clone git@github.com:USERNAME/genomehubs.git

3. Create a branch for local development::

    git checkout -b name-of-your-bugfix-or-feature

   Now you can make your changes locally.

4. When you're done making changes run all the checks and docs builder with `tox <https://tox.readthedocs.io/en/latest/install.html>`_ one command::

    tox

5. Commit your changes and push your branch to GitHub::

    git add .
    git commit -m "Your detailed description of your changes."
    git push origin name-of-your-bugfix-or-feature

6. Submit a pull request through the GitHub website.

Pull Request Guidelines
-----------------------

If you need some code review or feedback while you're developing the code just make the pull request.

For merging, you should:

1. Include passing tests (run ``tox``) [1]_.
2. Update documentation when there's new API, functionality etc.
3. Add a note to ``CHANGELOG.rst`` about the changes.
4. Add yourself to ``AUTHORS.rst``.

.. [1] If you don't have all the necessary python versions available locally you can rely on Travis - it will
       `run the tests <https://travis-ci.org/genomehubs/genomehubs/pull_requests>`_ for each change you add in the pull request.

       It will be slower though ...

Tips
----

To run a subset of tests::

    tox -e envname -- pytest -k test_myfeature

To run all the test environments in *parallel*::

    tox -p
