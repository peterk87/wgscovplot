from typing import Dict

import pandas as pd

from wgscovplot.tools import mosdepth


def cov_stats_to_html_table(
        sample_depth_info: Dict[str, mosdepth.MosdepthDepthInfo]
) -> str:
    df = pd.DataFrame([x.dict() for x in sample_depth_info.values()])
    low_coverage_threshold = list(sample_depth_info.values())[0].low_coverage_threshold
    columns = [
        ('sample', 'Sample'),
        ('n_zero_coverage', '# 0 Coverage Positions'),
        ('zero_coverage_coords', '0 Coverage Regions'),
        ('low_coverage_threshold', 'Low Coverage Threshold'),
        ('n_low_coverage', f'# Low Coverage Positions (< {low_coverage_threshold}X)'),
        ('low_coverage_coords', f'Low Coverage Regions (< {low_coverage_threshold}X)'),
        ('genome_coverage', f'% Genome Coverage >= {low_coverage_threshold}X'),
        ('mean_coverage', 'Mean Coverage Depth (X)'),
        ('median_coverage', 'Median Coverage Depth (X)'),
        ('ref_seq_length', 'Ref Sequence Length (bp)'),
        ('max_depth', 'Max Depth (X)'),
    ]
    df.sort_values(by=['sample'], inplace=True)
    df.drop(columns=['low_coverage_threshold'], inplace=True)
    df.rename(columns={k: v for k, v in columns}, inplace=True)
    return df.to_html(
        classes="table table-striped table-hover table-bordered table-responsive-md",
        float_format=lambda x: f'{x:0.2f}',
        justify="left",
        table_id="summary-coverage-stat",
        index=False,
    )