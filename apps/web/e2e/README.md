Browser tests live here. The unit suite is under src.

The two spec files cover what a browser owns: the treegrid keyboard model, the hierarchy reaching assistive technology, the selection that remaps the chart, and the loading, error, empty-year and invalid-year states. The API has no switch for the states, so the specs drive them by intercepting the route.

Every spec states what it asserts, and the assertions are about what a reviewer can see: the accessible name of the chart, the aria attributes on the rows, the focus, the URL and the request count. Two specs (the chevron focus spec and the figure accessible-name spec) were run against the old behaviour on purpose before they were kept; the rest were written with the feature and pass.
